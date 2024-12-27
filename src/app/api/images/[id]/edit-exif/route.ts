import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

interface EditExifData {
  keywords: string[]
  copyright: string
  description: string
  make: string
  model: string
  lens: string
  aperture: string
  shutterSpeed: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let db;
  try {
    const data = await request.json() as EditExifData
    const { id } = params

    console.log('Received data:', data)

    // Open database connection
    db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    })

    // Start transaction
    await db.run('BEGIN TRANSACTION')

    try {
      // Update common EXIF data
      await db.run(`
        UPDATE common_exif SET
          camera_make = ?,
          camera_model = ?,
          lens_info = ?,
          aperture = ?,
          shutter_speed = ?,
          copyright = ?
        WHERE photo_id = ?
      `, [
        data.make,
        data.model,
        data.lens,
        data.aperture,
        data.shutterSpeed,
        data.copyright,
        id
      ])

      // Update description in photos table
      await db.run(`
        UPDATE photos SET
          description = ?
        WHERE id = ?
      `, [data.description, id])

      // Handle keywords update
      // First, remove all existing keywords for this photo
      await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', [id])

      // Then insert new keywords
      for (const keyword of data.keywords) {
        // First ensure the keyword exists in keywords table
        let keywordId = await db.get('SELECT id FROM keywords WHERE keyword = ?', keyword)
        
        if (!keywordId) {
          // Insert new keyword
          const result = await db.run('INSERT INTO keywords (keyword) VALUES (?)', keyword)
          keywordId = { id: result.lastID }
        }

        // Link keyword to photo
        await db.run(
          'INSERT INTO photo_keywords (photo_id, keyword_id) VALUES (?, ?)',
          [id, keywordId.id]
        )
      }

      await db.run('COMMIT')

      // Get updated photo data to return
      const photo = await db.get(`
        SELECT 
          p.*,
          ce.camera_make,
          ce.camera_model,
          ce.lens_info as lens,
          ce.aperture,
          ce.shutter_speed as shutterSpeed,
          ce.copyright
        FROM photos p
        LEFT JOIN common_exif ce ON p.id = ce.photo_id
        WHERE p.id = ?
      `, id)

      if (!photo) {
        throw new Error('Photo not found after update')
      }

      // Get updated keywords
      const keywords = await db.all(`
        SELECT k.keyword
        FROM photo_keywords pk
        JOIN keywords k ON pk.keyword_id = k.id
        WHERE pk.photo_id = ?
      `, [id])

      const updatedPhoto = {
        ...photo,
        keywords: keywords.map(k => k.keyword),
        exif: {
          make: photo.camera_make,
          model: photo.camera_model,
          lens: photo.lens,
          aperture: photo.aperture,
          shutterSpeed: photo.shutterSpeed,
          copyright: photo.copyright,
          description: photo.description
        }
      }

      return NextResponse.json(updatedPhoto)

    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }

  } catch (error) {
    const err = error as Error
    console.error('Error in PUT handler:', err)
    return NextResponse.json(
      { error: `Failed to update EXIF data: ${err.message}` },
      { status: 500 }
    )
  } finally {
    if (db) {
      await db.close()
    }
  }
} 
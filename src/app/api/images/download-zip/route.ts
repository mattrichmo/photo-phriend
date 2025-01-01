import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function POST(request: Request) {
  let db;
  try {
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Open database connection
    db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    })

    // Get all photo information including details and EXIF data
    const photos = await db.all(`
      SELECT 
        p.*,
        pd.name as full_name,
        pd.path as full_path,
        pd_opt.name as optimized_name,
        pd_opt.path as optimized_path,
        pd_min.name as minified_name,
        pd_min.path as minified_path,
        pd_thumb.name as thumb_name,
        pd_thumb.path as thumb_path,
        re.exif_data as raw_exif,
        ce.*
      FROM photos p
      LEFT JOIN photo_details pd 
        ON p.id = pd.photo_id AND pd.version_type = 'full'
      LEFT JOIN photo_details pd_opt 
        ON p.id = pd_opt.photo_id AND pd_opt.version_type = 'optimized'
      LEFT JOIN photo_details pd_min 
        ON p.id = pd_min.photo_id AND pd_min.version_type = 'minified'
      LEFT JOIN photo_details pd_thumb 
        ON p.id = pd_thumb.photo_id AND pd_thumb.version_type = 'thumb'
      LEFT JOIN raw_exif re ON p.id = re.photo_id
      LEFT JOIN common_exif ce ON p.id = ce.photo_id
      WHERE p.id IN (${imageIds.map(() => '?').join(',')})
    `, imageIds)

    console.log('Database query results:', JSON.stringify(photos, null, 2))
    
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    // Get keywords for each photo
    for (const photo of photos) {
      const keywords = await db.all(`
        SELECT k.keyword
        FROM photo_keywords pk
        JOIN keywords k ON pk.keyword_id = k.id
        WHERE pk.photo_id = ?
      `, [photo.id])
      photo.keywords = keywords.map(k => k.keyword)
    }
    
    // Create a new JSZip instance
    const zip = new JSZip()

    // Create folders for each version
    const originalFolder = zip.folder('original')
    const optimizedFolder = zip.folder('optimized')
    const minifiedFolder = zip.folder('minified')
    const thumbFolder = zip.folder('thumb')
    const metadataFolder = zip.folder('metadata')

    if (!originalFolder || !optimizedFolder || !minifiedFolder || !thumbFolder || !metadataFolder) {
      throw new Error('Failed to create zip folders')
    }

    // Add files to the archive
    for (const photo of photos) {
      try {
        // Add original image
        const originalPath = path.join(process.cwd(), 'public', 'photos', photo.id, photo.filename)
        console.log('Reading original file from:', originalPath)
        const originalContent = await fs.readFile(originalPath)
        originalFolder.file(photo.filename, originalContent)

        // Add optimized image
        const optimizedPath = path.join(process.cwd(), 'public', 'photos', 'optimized', photo.optimized_name)
        console.log('Reading optimized file from:', optimizedPath)
        const optimizedContent = await fs.readFile(optimizedPath)
        optimizedFolder.file(photo.optimized_name, optimizedContent)

        // Add minified image
        const minifiedPath = path.join(process.cwd(), 'public', 'photos', 'minified', photo.minified_name)
        console.log('Reading minified file from:', minifiedPath)
        const minifiedContent = await fs.readFile(minifiedPath)
        minifiedFolder.file(photo.minified_name, minifiedContent)

        // Add thumbnail image
        const thumbPath = path.join(process.cwd(), 'public', 'photos', 'thumb', photo.thumb_name)
        console.log('Reading thumbnail file from:', thumbPath)
        const thumbContent = await fs.readFile(thumbPath)
        thumbFolder.file(photo.thumb_name, thumbContent)

        // Add metadata file
        const metadata = {
          id: photo.id,
          exif: {
            raw: photo.raw_exif ? JSON.parse(photo.raw_exif) : null,
            common: {
              dateTime: photo.date_time,
              cameraMake: photo.camera_make,
              cameraModel: photo.camera_model,
              lensInfo: photo.lens_info,
              focalLength: photo.focal_length,
              focalLength35mm: photo.focal_length_35mm,
              aperture: photo.aperture,
              shutterSpeed: photo.shutter_speed,
              iso: photo.iso,
              exposureProgram: photo.exposure_program,
              exposureMode: photo.exposure_mode,
              meteringMode: photo.metering_mode,
              whiteBalance: photo.white_balance,
              flash: photo.flash,
              software: photo.software,
              rating: photo.rating,
              copyright: photo.copyright,
              artist: photo.artist
            }
          },
          details: {
            full: {
              name: photo.filename,
              path: `/photos/${photo.id}/${photo.filename}`
            },
            optimized: {
              name: photo.optimized_name,
              path: `/photos/optimized/${photo.optimized_name}`
            },
            minified: {
              name: photo.minified_name,
              path: `/photos/minified/${photo.minified_name}`
            },
            thumb: {
              name: photo.thumb_name,
              path: `/photos/thumb/${photo.thumb_name}`
            }
          },
          keywords: photo.keywords,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt
        }
        metadataFolder.file(`${photo.filename.split('.')[0]}_metadata.json`, JSON.stringify(metadata, null, 2))
      } catch (error) {
        console.error(`Error adding file ${photo.filename} to zip:`, error)
      }
    }

    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Create and return the response with the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=images-${new Date().toISOString().split('T')[0]}.zip`
      }
    })
  } catch (error) {
    console.error('Error creating zip file:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json({ error: 'Failed to create zip file' }, { status: 500 })
  } finally {
    if (db) {
      await db.close()
    }
  }
} 
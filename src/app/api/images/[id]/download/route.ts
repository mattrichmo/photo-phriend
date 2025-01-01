import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let db;
  try {
    const { id } = params

    // Open database connection
    db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    })

    // Get photo information including details and EXIF data
    const photo = await db.get(`
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
      WHERE p.id = ?
    `, id)

    console.log('Database query result:', JSON.stringify(photo, null, 2))

    if (!photo) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Get keywords for the photo
    const keywords = await db.all(`
      SELECT k.keyword
      FROM photo_keywords pk
      JOIN keywords k ON pk.keyword_id = k.id
      WHERE pk.photo_id = ?
    `, [id])
    photo.keywords = keywords.map(k => k.keyword)

    // Create a zip file containing all versions
    const zip = new JSZip()

    // Add original image
    const originalPath = path.join(process.cwd(), 'public', 'photos', photo.id, photo.filename)
    console.log('Attempting to read original file from:', originalPath)
    const originalBuffer = await fs.readFile(originalPath)
    zip.file(photo.filename, originalBuffer)

    // Add optimized image
    const optimizedPath = path.join(process.cwd(), 'public', 'photos', 'optimized', photo.optimized_name)
    console.log('Attempting to read optimized file from:', optimizedPath)
    const optimizedBuffer = await fs.readFile(optimizedPath)
    zip.file(photo.optimized_name, optimizedBuffer)

    // Add minified image
    const minifiedPath = path.join(process.cwd(), 'public', 'photos', 'minified', photo.minified_name)
    console.log('Attempting to read minified file from:', minifiedPath)
    const minifiedBuffer = await fs.readFile(minifiedPath)
    zip.file(photo.minified_name, minifiedBuffer)

    // Add thumbnail image
    const thumbPath = path.join(process.cwd(), 'public', 'photos', 'thumb', photo.thumb_name)
    console.log('Attempting to read thumbnail file from:', thumbPath)
    const thumbBuffer = await fs.readFile(thumbPath)
    zip.file(photo.thumb_name, thumbBuffer)

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
    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${photo.filename.split('.')[0]}_package.zip"`,
      },
    })
  } catch (error) {
    console.error('Error downloading image:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  } finally {
    if (db) {
      await db.close()
    }
  }
} 
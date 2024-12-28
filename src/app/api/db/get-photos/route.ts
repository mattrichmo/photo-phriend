import { NextResponse } from 'next/server'
import { Database } from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'db/photo-phriend.db')
    console.log('Opening database at:', dbPath)

    // Open database connection
    const db = await open({
      filename: dbPath,
      driver: Database
    })

    console.log('Database connection opened successfully')

    // Fetch all photos with their details and EXIF data
    const photos = await db.all(`
      SELECT 
        p.*,
        pd_opt.name as optimized_name,
        pd_opt.size as optimized_size,
        pd_opt.type as optimized_type,
        '/photos/optimized/' || pd_opt.name as optimized_path,
        pd_min.name as minified_name,
        pd_min.size as minified_size,
        pd_min.type as minified_type,
        '/photos/minified/' || pd_min.name as minified_path,
        pd_thumb.name as thumb_name,
        pd_thumb.size as thumb_size,
        pd_thumb.type as thumb_type,
        '/photos/thumb/' || pd_thumb.name as thumb_path,
        ce.camera_make as make,
        ce.camera_model as model,
        ce.lens_info as lens,
        ce.aperture,
        ce.shutter_speed,
        ce.iso,
        ce.focal_length,
        ce.copyright,
        p.description
      FROM photos p
      LEFT JOIN photo_details pd_opt 
        ON p.id = pd_opt.photo_id AND pd_opt.version_type = 'optimized'
      LEFT JOIN photo_details pd_min 
        ON p.id = pd_min.photo_id AND pd_min.version_type = 'minified'
      LEFT JOIN photo_details pd_thumb 
        ON p.id = pd_thumb.photo_id AND pd_thumb.version_type = 'thumb'
      LEFT JOIN common_exif ce ON p.id = ce.photo_id
      ORDER BY p.createdAt DESC
    `)

    console.log(`Found ${photos.length} photos`)

    // Fetch keywords for each photo
    const photosWithKeywords = await Promise.all(photos.map(async (photo) => {
      const keywords = await db.all(`
        SELECT k.keyword as name
        FROM photo_keywords pk
        JOIN keywords k ON pk.keyword_id = k.id
        WHERE pk.photo_id = ?
      `, [photo.id])

      return {
        id: photo.id,
        details: {
          full: {
            name: photo.filename,
            path: photo.path,
            size: photo.size,
            type: photo.type
          },
          optimized: {
            name: photo.optimized_name,
            path: photo.optimized_path,
            size: photo.optimized_size,
            type: photo.optimized_type
          },
          minified: {
            name: photo.minified_name,
            path: photo.minified_path,
            size: photo.minified_size,
            type: photo.minified_type
          },
          thumb: {
            name: photo.thumb_name,
            path: photo.thumb_path,
            size: photo.thumb_size,
            type: photo.thumb_type
          }
        },
        exif: {
          make: photo.make,
          model: photo.model,
          lens: photo.lens,
          aperture: photo.aperture,
          shutterSpeed: photo.shutter_speed,
          iso: photo.iso,
          focalLength: photo.focal_length,
          copyright: photo.copyright,
          description: photo.description
        },
        keywords: keywords.map(k => k.name)
      }
    }))

    await db.close()
    console.log('Database connection closed')

    return NextResponse.json({ images: photosWithKeywords })
  } catch (error) {
    console.error('Detailed error in get-photos:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

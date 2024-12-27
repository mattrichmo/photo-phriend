import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Database } from 'sqlite3'
import { open } from 'sqlite'

export async function GET(
  request: Request,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const { id, version } = params
    
    // Get the image path from the database
    const dbPath = path.join(process.cwd(), 'photo-phriend.db')
    
    const db = await open({
      filename: dbPath,
      driver: Database
    })

    let query = ''
    if (version === 'thumb') {
      query = `SELECT pd.path FROM photo_details pd WHERE pd.photo_id = ? AND pd.version_type = 'thumb'`
    } else if (version === 'optimized') {
      query = `SELECT pd.path FROM photo_details pd WHERE pd.photo_id = ? AND pd.version_type = 'optimized'`
    } else {
      query = `SELECT path FROM photos WHERE id = ?`
    }

    const result = await db.get(query, [id])
    await db.close()

    if (!result || !result.path) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const imagePath = result.path
    const imageBuffer = fs.readFileSync(imagePath)
    
    // Determine content type from file extension
    const ext = path.extname(imagePath).toLowerCase()
    let contentType = 'image/jpeg' // default
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.webp') contentType = 'image/webp'

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Error serving image', { status: 500 })
  }
} 
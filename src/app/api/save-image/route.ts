import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const filename = formData.get('filename') as string

    if (!file || !type || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create directories if they don't exist
    const photosDir = path.join(process.cwd(), 'public', 'photos')
    const originalDir = path.join(photosDir, 'original')
    const optimizedDir = path.join(photosDir, 'optimized')

    await fs.mkdir(originalDir, { recursive: true })
    await fs.mkdir(optimizedDir, { recursive: true })

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    if (type === 'original') {
      // Save original file
      const originalPath = path.join(originalDir, filename)
      await fs.writeFile(originalPath, buffer)
      
      return NextResponse.json({ success: true })
    } else if (type === 'optimized') {
      // Save optimized file and update photos.json
      const id = formData.get('id') as string
      const originalSize = parseInt(formData.get('originalSize') as string)
      const optimizedSize = parseInt(formData.get('optimizedSize') as string)
      
      if (!id || !originalSize || !optimizedSize) {
        return NextResponse.json(
          { error: 'Missing required fields for optimized image' },
          { status: 400 }
        )
      }

      const optimizedName = `${filename.split('.')[0]}_optimized.jpg`
      const optimizedPath = path.join(optimizedDir, optimizedName)
      await fs.writeFile(optimizedPath, buffer)

      // Update photos.json
      const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
      let photos = []

      try {
        const photosData = await fs.readFile(photosJsonPath, 'utf-8')
        photos = JSON.parse(photosData)
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
        console.error('Error reading photos.json:', error)
      }

      // Add new image data
      photos.push({
        id,
        name: filename,
        size: originalSize,
        optimizedSize,
        originalPath: `/photos/original/${filename}`,
        optimizedPath: `/photos/optimized/${optimizedName}`,
        createdAt: new Date().toISOString(),
      })

      // Save updated photos.json
      await fs.writeFile(photosJsonPath, JSON.stringify(photos, null, 2))

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error saving image:', error)
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    )
  }
} 
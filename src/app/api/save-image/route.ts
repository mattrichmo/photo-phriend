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
    const minifiedDir = path.join(photosDir, 'minified')
    const thumbDir = path.join(photosDir, 'thumb')

    await fs.mkdir(originalDir, { recursive: true })
    await fs.mkdir(optimizedDir, { recursive: true })
    await fs.mkdir(minifiedDir, { recursive: true })
    await fs.mkdir(thumbDir, { recursive: true })

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    if (type === 'original') {
      // Save original file
      const originalPath = path.join(originalDir, filename)
      await fs.writeFile(originalPath, buffer)
      
      return NextResponse.json({ success: true })
    } else if (type === 'processed') {
      // Save all processed versions and update photos.json
      const id = formData.get('id') as string
      const originalSize = parseInt(formData.get('originalSize') as string)
      const optimizedSize = parseInt(formData.get('optimizedSize') as string)
      const minifiedSize = parseInt(formData.get('minifiedSize') as string)
      const thumbSize = parseInt(formData.get('thumbSize') as string)
      const exifData = formData.get('exif') ? JSON.parse(formData.get('exif') as string) : null
      
      if (!id || !originalSize) {
        return NextResponse.json(
          { error: 'Missing required fields for processed image' },
          { status: 400 }
        )
      }

      // Save optimized version
      const optimizedName = `${filename.split('.')[0]}_optimized.jpg`
      const optimizedPath = path.join(optimizedDir, optimizedName)
      await fs.writeFile(optimizedPath, buffer)

      // Save minified version
      const minifiedName = `${filename.split('.')[0]}_minified.jpg`
      const minifiedPath = path.join(minifiedDir, minifiedName)
      const minifiedBuffer = Buffer.from(await (formData.get('minifiedBuffer') as File).arrayBuffer())
      await fs.writeFile(minifiedPath, minifiedBuffer)

      // Save thumbnail version
      const thumbName = `${filename.split('.')[0]}_thumb.jpg`
      const thumbPath = path.join(thumbDir, thumbName)
      const thumbBuffer = Buffer.from(await (formData.get('thumbBuffer') as File).arrayBuffer())
      await fs.writeFile(thumbPath, thumbBuffer)

      // Update photos.json
      const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
      let photos = []

      try {
        const photosData = await fs.readFile(photosJsonPath, 'utf-8')
        photos = JSON.parse(photosData)
      } catch (error) {
        console.error('Error reading photos.json:', error)
      }

      // Add new image data
      photos.push({
        id,
        exif: exifData,
        details: {
          full: {
            name: filename,
            size: originalSize,
            type: 'image/jpeg',
            path: `/photos/original/${filename}`,
          },
          optimized: {
            name: optimizedName,
            size: optimizedSize,
            type: 'image/jpeg',
            path: `/photos/optimized/${optimizedName}`,
          },
          minified: {
            name: minifiedName,
            size: minifiedSize,
            type: 'image/jpeg',
            path: `/photos/minified/${minifiedName}`,
          },
          thumb: {
            name: thumbName,
            size: thumbSize,
            type: 'image/jpeg',
            path: `/photos/thumb/${thumbName}`,
          }
        },
        keywords: [],
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
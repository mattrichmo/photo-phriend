import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import { FileData } from '@/types/file'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Read photos.json to find the image
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    const photosData = await fs.readFile(photosJsonPath, 'utf-8')
    const photos: FileData[] = JSON.parse(photosData)

    const image = photos.find((photo: FileData) => photo.id === id)
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Create a zip file containing all versions
    const zip = new JSZip()

    // Add original image
    const originalPath = path.join(process.cwd(), 'public', image.details.full.path)
    const originalBuffer = await fs.readFile(originalPath)
    zip.file(image.details.full.name, originalBuffer)

    // Add optimized image
    const optimizedPath = path.join(process.cwd(), 'public', image.details.optimized.path)
    const optimizedBuffer = await fs.readFile(optimizedPath)
    zip.file(image.details.optimized.name, optimizedBuffer)

    // Add minified image
    const minifiedPath = path.join(process.cwd(), 'public', image.details.minified.path)
    const minifiedBuffer = await fs.readFile(minifiedPath)
    zip.file(image.details.minified.name, minifiedBuffer)

    // Add thumbnail image
    const thumbPath = path.join(process.cwd(), 'public', image.details.thumb.path)
    const thumbBuffer = await fs.readFile(thumbPath)
    zip.file(image.details.thumb.name, thumbBuffer)

    // Add metadata file
    const metadata = {
      id: image.id,
      exif: image.exif,
      details: image.details,
      keywords: image.keywords,
      createdAt: new Date().toISOString()
    }
    zip.file('metadata.json', JSON.stringify(metadata, null, 2))

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${image.details.full.name.split('.')[0]}_package.zip"`,
      },
    })
  } catch (error) {
    console.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
} 
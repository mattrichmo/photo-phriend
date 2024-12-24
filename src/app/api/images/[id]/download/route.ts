import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'

interface ImageData {
  id: string
  name: string
  originalPath: string
  optimizedPath: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Read photos.json to find the image
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    const photosData = await fs.readFile(photosJsonPath, 'utf-8')
    const photos: ImageData[] = JSON.parse(photosData)

    const image = photos.find((photo: ImageData) => photo.id === id)
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Create a zip file containing both original and optimized images
    const zip = new JSZip()

    // Add original image
    const originalPath = path.join(process.cwd(), 'public', image.originalPath)
    const originalBuffer = await fs.readFile(originalPath)
    zip.file(image.name, originalBuffer)

    // Add optimized image
    const optimizedPath = path.join(process.cwd(), 'public', image.optimizedPath)
    const optimizedBuffer = await fs.readFile(optimizedPath)
    const optimizedName = `${image.name.split('.')[0]}_optimized.jpg`
    zip.file(optimizedName, optimizedBuffer)

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${image.name.split('.')[0]}_package.zip"`,
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
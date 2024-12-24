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

export async function POST(request: Request) {
  try {
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Read the current images data
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    const photosData = await fs.readFile(photosJsonPath, 'utf-8')
    const photos = JSON.parse(photosData)
    
    // Find the images to include in the zip
    const imagesToDownload = photos.filter((img: ImageData) => imageIds.includes(img.id))

    // Create a new JSZip instance
    const zip = new JSZip()

    // Create folders for original and optimized images
    const originalFolder = zip.folder('original')
    const optimizedFolder = zip.folder('optimized')

    if (!originalFolder || !optimizedFolder) {
      throw new Error('Failed to create zip folders')
    }

    // Add files to the archive
    for (const image of imagesToDownload) {
      try {
        // Add original image
        const originalPath = path.join(process.cwd(), 'public', image.originalPath)
        const originalContent = await fs.readFile(originalPath)
        originalFolder.file(image.name, originalContent)

        // Add optimized image
        const optimizedPath = path.join(process.cwd(), 'public', image.optimizedPath)
        const optimizedContent = await fs.readFile(optimizedPath)
        const optimizedName = `${image.name.split('.')[0]}_optimized.jpg`
        optimizedFolder.file(optimizedName, optimizedContent)
      } catch (error) {
        console.error(`Error adding file ${image.name} to zip:`, error)
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
    return NextResponse.json({ error: 'Failed to create zip file' }, { status: 500 })
  }
} 
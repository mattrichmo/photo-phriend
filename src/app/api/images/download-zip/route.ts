import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import { FileData } from '@/types/file'

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
    const imagesToDownload = photos.filter((img: FileData) => imageIds.includes(img.id))

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
    for (const image of imagesToDownload) {
      try {
        // Add original image
        const originalPath = path.join(process.cwd(), 'public', image.details.full.path)
        const originalContent = await fs.readFile(originalPath)
        originalFolder.file(image.details.full.name, originalContent)

        // Add optimized image
        const optimizedPath = path.join(process.cwd(), 'public', image.details.optimized.path)
        const optimizedContent = await fs.readFile(optimizedPath)
        optimizedFolder.file(image.details.optimized.name, optimizedContent)

        // Add minified image
        const minifiedPath = path.join(process.cwd(), 'public', image.details.minified.path)
        const minifiedContent = await fs.readFile(minifiedPath)
        minifiedFolder.file(image.details.minified.name, minifiedContent)

        // Add thumbnail image
        const thumbPath = path.join(process.cwd(), 'public', image.details.thumb.path)
        const thumbContent = await fs.readFile(thumbPath)
        thumbFolder.file(image.details.thumb.name, thumbContent)

        // Add metadata file
        const metadata = {
          id: image.id,
          exif: image.exif,
          details: image.details,
          keywords: image.keywords,
          createdAt: new Date().toISOString()
        }
        metadataFolder.file(`${image.details.full.name.split('.')[0]}_metadata.json`, JSON.stringify(metadata, null, 2))
      } catch (error) {
        console.error(`Error adding file ${image.details.full.name} to zip:`, error)
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
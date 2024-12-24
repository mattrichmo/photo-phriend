import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface ImageData {
  id: string
  name: string
  originalPath: string
  optimizedPath: string
}

export async function DELETE(request: Request) {
  try {
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Read the current images data
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    let photos: ImageData[] = []
    
    try {
      const photosData = await fs.readFile(photosJsonPath, 'utf-8')
      photos = JSON.parse(photosData)
    } catch (error) {
      console.error('Error reading photos.json:', error)
      return NextResponse.json({ error: 'Failed to read photos data' }, { status: 500 })
    }
    
    // Find the images to delete
    const imagesToDelete = photos.filter((img: ImageData) => imageIds.includes(img.id))
    
    // Delete the actual files
    for (const image of imagesToDelete) {
      try {
        // Delete original image
        const originalPath = path.join(process.cwd(), 'public', image.originalPath)
        await fs.unlink(originalPath)
        
        // Delete optimized image
        if (image.optimizedPath) {
          const optimizedPath = path.join(process.cwd(), 'public', image.optimizedPath)
          await fs.unlink(optimizedPath)
        }
      } catch (error) {
        console.error(`Failed to delete file for image ${image.id}:`, error)
      }
    }

    // Update the JSON file
    const updatedPhotos = photos.filter((img: ImageData) => !imageIds.includes(img.id))
    await fs.writeFile(photosJsonPath, JSON.stringify(updatedPhotos, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting images:', error)
    return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 })
  }
} 
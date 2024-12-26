import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { FileData } from '@/types/file'

export async function DELETE(request: Request) {
  try {
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Read the trash data
    const trashJsonPath = path.join(process.cwd(), 'public', 'trash.json')
    let trashItems: (FileData & { deleteDate: string })[] = []
    
    try {
      const trashData = await fs.readFile(trashJsonPath, 'utf-8')
      trashItems = JSON.parse(trashData)
    } catch {
      // If trash.json doesn't exist, nothing to delete
      return NextResponse.json({ success: true })
    }
    
    // Find the images to delete
    const imagesToDelete = trashItems.filter(img => imageIds.includes(img.id))
    
    // Delete the actual files
    for (const image of imagesToDelete) {
      try {
        // Delete original image
        const originalPath = path.join(process.cwd(), 'public', image.details.full.path)
        await fs.unlink(originalPath)
        
        // Delete optimized image
        const optimizedPath = path.join(process.cwd(), 'public', image.details.optimized.path)
        await fs.unlink(optimizedPath)

        // Delete minified image
        const minifiedPath = path.join(process.cwd(), 'public', image.details.minified.path)
        await fs.unlink(minifiedPath)

        // Delete thumbnail image
        const thumbPath = path.join(process.cwd(), 'public', image.details.thumb.path)
        await fs.unlink(thumbPath)
      } catch (error) {
        console.error(`Failed to delete file for image ${image.id}:`, error)
      }
    }

    // Update trash.json to remove the deleted items
    const updatedTrashItems = trashItems.filter(img => !imageIds.includes(img.id))
    await fs.writeFile(trashJsonPath, JSON.stringify(updatedTrashItems, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting images:', error)
    return NextResponse.json(
      { error: 'Failed to permanently delete images' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { FileData } from '@/types/file'

export async function GET() {
  try {
    const trashJsonPath = path.join(process.cwd(), 'public', 'trash.json')
    let trashItems: (FileData & { deleteDate: string })[] = []
    
    try {
      const trashData = await fs.readFile(trashJsonPath, 'utf-8')
      trashItems = JSON.parse(trashData)
    } catch {
      // If trash.json doesn't exist, return empty array
      trashItems = []
    }

    // Remove items older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const itemsToRemove = trashItems.filter(item => 
      new Date(item.deleteDate) < thirtyDaysAgo
    )
    
    // Delete files for items older than 30 days
    for (const image of itemsToRemove) {
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

    // Update trash.json with current items (removing old ones)
    trashItems = trashItems.filter(item => 
      new Date(item.deleteDate) >= thirtyDaysAgo
    )
    await fs.writeFile(trashJsonPath, JSON.stringify(trashItems, null, 2))

    return NextResponse.json({ images: trashItems })
  } catch (error) {
    console.error('Error fetching trash:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trash' },
      { status: 500 }
    )
  }
} 
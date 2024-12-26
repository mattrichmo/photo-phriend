import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { FileData } from '@/types/file'

export async function POST(request: Request) {
  try {
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Read both photos and trash data
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    const trashJsonPath = path.join(process.cwd(), 'public', 'trash.json')
    let photos: FileData[] = []
    let trashItems: (FileData & { deleteDate: string })[] = []
    
    try {
      const [photosData, trashData] = await Promise.all([
        fs.readFile(photosJsonPath, 'utf-8'),
        fs.readFile(trashJsonPath, 'utf-8')
      ])
      
      photos = JSON.parse(photosData)
      trashItems = JSON.parse(trashData)
    } catch (error) {
      console.error('Error reading data files:', error)
      return NextResponse.json({ error: 'Failed to read data files' }, { status: 500 })
    }
    
    // Find the images to revert
    const imagesToRevert = trashItems.filter(img => imageIds.includes(img.id))
    
    if (imagesToRevert.length === 0) {
      return NextResponse.json({ error: 'No images found to revert' }, { status: 404 })
    }

    // Remove deleteDate property from images before adding back to photos
    const cleanedImages = imagesToRevert.map(image => 
      Object.fromEntries(
        Object.entries(image).filter(([key]) => key !== 'deleteDate')
      ) as FileData
    )
    
    // Add back to photos array
    photos.push(...cleanedImages)
    
    // Remove from trash array
    trashItems = trashItems.filter(img => !imageIds.includes(img.id))
    
    // Update both files
    await Promise.all([
      fs.writeFile(photosJsonPath, JSON.stringify(photos, null, 2)),
      fs.writeFile(trashJsonPath, JSON.stringify(trashItems, null, 2))
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reverting images:', error)
    return NextResponse.json(
      { error: 'Failed to revert images' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { loadPhotos, savePhotos } from '../../../../../lib/photos'
import { FileData } from '@/types/file'

interface EditExifData {
  keywords: string[]
  copyright: string
  description: string
  make: string
  model: string
  lens: string
  aperture: string
  shutterSpeed: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json() as EditExifData
    const { id } = params

    console.log('Received data:', data)

    // Load current photos data
    const photos = await loadPhotos()
    const photoIndex = photos.findIndex((p: FileData) => p.id === id)
    
    if (photoIndex === -1) {
      console.error('Photo not found:', id)
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const currentPhoto = photos[photoIndex]
    console.log('Current photo:', currentPhoto)
    
    // Update the photo metadata
    const updatedPhoto: FileData = {
      ...currentPhoto,
      keywords: data.keywords || [],
      exif: currentPhoto.exif ? {
        ...currentPhoto.exif,
        make: data.make,
        model: data.model,
        lens: data.lens,
        aperture: data.aperture,
        shutterSpeed: data.shutterSpeed,
        copyright: data.copyright,
        description: data.description
      } : null
    }

    // Update photos.json first since we can't reliably update EXIF data with Sharp
    try {
      photos[photoIndex] = updatedPhoto
      await savePhotos(photos)
      console.log('Successfully updated photos.json')
    } catch (error) {
      const err = error as Error
      console.error('Error saving photos.json:', err)
      return NextResponse.json(
        { error: `Failed to save metadata: ${err.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedPhoto)
  } catch (error) {
    const err = error as Error
    console.error('Error in PUT handler:', err)
    return NextResponse.json(
      { error: `Failed to update EXIF data: ${err.message}` },
      { status: 500 }
    )
  }
} 
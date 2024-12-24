import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Strip all metadata by passing an empty object
    image.withMetadata({})

    // Keep original format but optimize
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      image.jpeg({ quality: 80 })
    } else if (metadata.format === 'png') {
      image.png({ quality: 80 })
    } else if (metadata.format === 'webp') {
      image.webp({ quality: 80 })
    } else {
      // Default to JPEG for other formats
      image.jpeg({ quality: 80 })
    }

    const optimizedBuffer = await image.toBuffer()

    // Return the optimized image
    return new NextResponse(optimizedBuffer, {
      headers: {
        'Content-Type': metadata.format ? `image/${metadata.format}` : 'image/jpeg',
        'Content-Length': optimizedBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error optimizing image:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    )
  }
} 
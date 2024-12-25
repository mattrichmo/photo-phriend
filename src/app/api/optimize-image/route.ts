import { NextResponse } from 'next/server'
import sharp from 'sharp'
import * as ExifReader from 'exifreader'

interface ExifData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  date?: string;
  time?: string;
  make?: string;
  model?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

interface OptimizationResult {
  optimized: {
    buffer: Buffer,
    size: number
  },
  minified: {
    buffer: Buffer,
    size: number
  },
  thumb: {
    buffer: Buffer,
    size: number
  },
  exif: ExifData | null
}

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

    // Extract EXIF data using ExifReader for more reliable extraction
    let exifData: ExifData | null = null
    try {
      const tags = await ExifReader.load(buffer)
      console.log('Raw EXIF tags:', JSON.stringify(tags, null, 2))
      
      if (tags) {
        const dateTime = tags['DateTimeOriginal'] || tags['DateTime'] || tags['MetadataDate']
        
        exifData = {
          latitude: tags['GPSLatitude']?.description ? Number(tags['GPSLatitude'].description) : undefined,
          longitude: tags['GPSLongitude']?.description ? Number(tags['GPSLongitude'].description) : undefined,
          altitude: tags['GPSAltitude']?.description ? Number(tags['GPSAltitude'].description) : undefined,
          
          date: dateTime?.description ? String(dateTime.description).split('T')[0] : undefined,
          time: dateTime?.description ? (String(dateTime.description).includes('T') ? 
            String(dateTime.description).split('T')[1].split('-')[0] : 
            String(dateTime.description).split(' ')[1]) : undefined,
          
          make: tags['Make']?.description,
          model: tags['Model']?.description,
          lens: tags['LensModel']?.description,
          
          aperture: tags['FNumber']?.description,
          shutterSpeed: tags['ExposureTime']?.description,
          iso: tags['ISOSpeedRatings']?.description
        }

        // Only remove undefined values
        Object.keys(exifData).forEach(key => {
          if (exifData && exifData[key as keyof ExifData] === undefined) {
            delete exifData[key as keyof ExifData]
          }
        })

        console.log('Processed EXIF data:', JSON.stringify(exifData, null, 2))
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error)
    }
    
    // Create optimized version (80% quality)
    const optimizedImage = sharp(buffer).withMetadata() // Keep metadata in optimized version
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      optimizedImage.jpeg({ quality: 80 })
    } else if (metadata.format === 'png') {
      optimizedImage.png({ quality: 80 })
    } else if (metadata.format === 'webp') {
      optimizedImage.webp({ quality: 80 })
    } else {
      optimizedImage.jpeg({ quality: 80 })
    }
    
    // Create minified version (reduced by 4x)
    const minifiedImage = sharp(buffer).withMetadata()
    const minWidth = Math.round((metadata.width || 0) / 2)
    const minHeight = Math.round((metadata.height || 0) / 2)
    minifiedImage.resize(minWidth, minHeight)
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      minifiedImage.jpeg({ quality: 70 })
    } else if (metadata.format === 'png') {
      minifiedImage.png({ quality: 70 })
    } else if (metadata.format === 'webp') {
      minifiedImage.webp({ quality: 70 })
    } else {
      minifiedImage.jpeg({ quality: 70 })
    }
    
    // Create thumbnail version (reduced by 8x)
    const thumbImage = sharp(buffer).withMetadata()
    const thumbWidth = Math.round((metadata.width || 0) / 3)
    const thumbHeight = Math.round((metadata.height || 0) / 3)
    thumbImage.resize(thumbWidth, thumbHeight)
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      thumbImage.jpeg({ quality: 60 })
    } else if (metadata.format === 'png') {
      thumbImage.png({ quality: 60 })
    } else if (metadata.format === 'webp') {
      thumbImage.webp({ quality: 60 })
    } else {
      thumbImage.jpeg({ quality: 60 })
    }

    // Process all versions in parallel
    const [optimizedBuffer, minifiedBuffer, thumbBuffer] = await Promise.all([
      optimizedImage.toBuffer(),
      minifiedImage.toBuffer(),
      thumbImage.toBuffer()
    ])

    const result: OptimizationResult = {
      optimized: {
        buffer: optimizedBuffer,
        size: optimizedBuffer.length
      },
      minified: {
        buffer: minifiedBuffer,
        size: minifiedBuffer.length
      },
      thumb: {
        buffer: thumbBuffer,
        size: thumbBuffer.length
      },
      exif: exifData
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error optimizing image:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    )
  }
} 
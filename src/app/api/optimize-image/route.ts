import { NextResponse } from 'next/server'
import sharp from 'sharp'
import * as ExifReader from 'exifreader'

interface ExifData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  date?: string;
  time?: string;
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

interface ExifTag {
  value: number | string;
  description?: string;
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
      
      // Helper function to safely get EXIF values
      const getExifValue = (tag: ExifTag | undefined): string | undefined => {
        if (!tag) return undefined
        return tag.description || tag.value.toString()
      }

      if (tags) {
        const gpsLat = tags['GPSLatitude'] as ExifTag | undefined
        const gpsLong = tags['GPSLongitude'] as ExifTag | undefined
        const dateTime = (tags['DateTimeOriginal'] || tags['DateTime']) as ExifTag | undefined
        
        exifData = {
          latitude: gpsLat ? parseFloat(getExifValue(gpsLat) || '') : undefined,
          longitude: gpsLong ? parseFloat(getExifValue(gpsLong) || '') : undefined,
          altitude: tags['GPSAltitude'] ? parseFloat(getExifValue(tags['GPSAltitude'] as ExifTag) || '') : undefined,
          date: dateTime ? getExifValue(dateTime)?.split(' ')[0] : undefined,
          time: dateTime ? getExifValue(dateTime)?.split(' ')[1] : undefined,
          camera: getExifValue(tags['Make'] as ExifTag) || getExifValue(tags['Model'] as ExifTag),
          lens: getExifValue(tags['LensModel'] as ExifTag),
          aperture: getExifValue(tags['FNumber'] as ExifTag),
          shutterSpeed: getExifValue(tags['ExposureTime'] as ExifTag),
          iso: getExifValue(tags['ISOSpeedRatings'] as ExifTag)
        }

        // Clean up undefined values
        Object.keys(exifData).forEach(key => {
          if (exifData && exifData[key as keyof ExifData] === undefined) {
            delete exifData[key as keyof ExifData]
          }
        })

        // If no meaningful EXIF data was found, set to null
        if (exifData && Object.keys(exifData).length === 0) {
          exifData = null
        }
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
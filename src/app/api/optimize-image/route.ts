import { NextResponse } from 'next/server'
import sharp from 'sharp'
import * as ExifReader from 'exifreader'
import { ExifData, ImageVersion } from '@/types/file'
import { insertOptimizedPhoto } from '@/components/db/insert-optimize'

interface OptimizationResult {
  id: string;
  optimized: ImageVersion;
  minified: ImageVersion;
  thumb: ImageVersion;
  exif: ExifData | null;
}

interface ResolutionValue {
  value: [number, number];
  description: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileId = formData.get('fileId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'No file ID provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Extract EXIF data
    let exifData: ExifData | null = null;
    try {
      const tags = await ExifReader.load(buffer);
      console.log('Raw EXIF tags:', JSON.stringify(tags, null, 2));

      if (tags) {
        const dateTime = tags['DateTimeOriginal'] || tags['DateTime'] || tags['MetadataDate'];
        const xResolution = tags['XResolution'] as ResolutionValue;
        const yResolution = tags['YResolution'] as ResolutionValue;
        
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
          iso: tags['ISOSpeedRatings']?.description,

          width: Number(tags['Image Width']?.value),
          height: Number(tags['Image Height']?.value),
          resolution: xResolution && yResolution ? {
            x: xResolution.value[0],
            y: yResolution.value[0],
            unit: tags['ResolutionUnit']?.description || 'inches'
          } : undefined,
          software: tags['Software']?.description,
          exposureMode: tags['ExposureMode']?.description,
          whiteBalance: tags['WhiteBalance']?.description,
          focalLength: tags['FocalLength']?.description,
          focalLengthIn35mm: typeof tags['FocalLengthIn35mmFilm']?.value === 'number' ? 
            tags['FocalLengthIn35mmFilm'].value : undefined,
          colorSpace: tags['ColorSpace']?.description,
          meteringMode: tags['MeteringMode']?.description,
          flash: tags['Flash']?.description,
          contrast: tags['Contrast']?.description,
          saturation: tags['Saturation']?.description,
          sharpness: tags['Sharpness']?.description,
          rawExif: tags
        };

        // Remove undefined values
        if (exifData) {
          Object.keys(exifData).forEach((key) => {
            if (exifData && exifData[key as keyof ExifData] === undefined) {
              delete exifData[key as keyof ExifData];
            }
          });
        }

        console.log('Processed EXIF data:', JSON.stringify(exifData, null, 2));
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
    }
    
    // Process images and get metadata for each version
    const [optimizedData, minifiedData, thumbData] = await Promise.all([
      processImage(buffer, metadata, 'optimized'),
      processImage(buffer, metadata, 'minified'),
      processImage(buffer, metadata, 'thumb')
    ]);

    // Create result object using the provided ID
    const result: OptimizationResult = {
      id: fileId,
      optimized: optimizedData,
      minified: minifiedData,
      thumb: thumbData,
      exif: exifData
    };

    // Insert data into database
    try {
      console.log('Attempting to insert data into database for photo:', fileId);
      const extension = metadata.format === 'jpeg' ? 'jpg' : (metadata.format || 'jpg');
      const dbResult = await insertOptimizedPhoto({
        id: fileId,
        filename: `${fileId}.${extension}`,
        type: metadata.format || 'unknown',
        optimized: optimizedData,
        minified: minifiedData,
        thumb: thumbData,
        exif: exifData
      });
      console.log('Database insertion result:', dbResult);
    } catch (error) {
      console.error('Failed to insert data into database:', error);
      // Continue execution to return processed images even if database insert fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in optimize-image endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    )
  }
}

async function processImage(buffer: Buffer, metadata: sharp.Metadata, version: 'optimized' | 'minified' | 'thumb'): Promise<ImageVersion> {
  const image = sharp(buffer).withMetadata();
  
  // Apply version-specific processing
  switch(version) {
    case 'optimized':
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        image.jpeg({ quality: 80 });
      } else if (metadata.format === 'png') {
        image.png({ quality: 80 });
      } else if (metadata.format === 'webp') {
        image.webp({ quality: 80 });
      } else {
        image.jpeg({ quality: 80 });
      }
      break;
    case 'minified':
      const minWidth = Math.round((metadata.width || 0) / 4);
      const minHeight = Math.round((metadata.height || 0) / 4);
      image.resize(minWidth, minHeight);
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        image.jpeg({ quality: 70 });
      } else if (metadata.format === 'png') {
        image.png({ quality: 70 });
      } else if (metadata.format === 'webp') {
        image.webp({ quality: 70 });
      } else {
        image.jpeg({ quality: 70 });
      }
      break;
    case 'thumb':
      const thumbWidth = Math.round((metadata.width || 0) / 8);
      const thumbHeight = Math.round((metadata.height || 0) / 8);
      image.resize(thumbWidth, thumbHeight);
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        image.jpeg({ quality: 60 });
      } else if (metadata.format === 'png') {
        image.png({ quality: 60 });
      } else if (metadata.format === 'webp') {
        image.webp({ quality: 60 });
      } else {
        image.jpeg({ quality: 60 });
      }
      break;
  }

  const processedBuffer = await image.toBuffer({ resolveWithObject: true });
  
  return {
    buffer: processedBuffer.data,
    size: processedBuffer.info.size,
    width: processedBuffer.info.width,
    height: processedBuffer.info.height
  };
} 
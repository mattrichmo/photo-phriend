import { NextResponse } from 'next/server'
import sharp from 'sharp'
import * as ExifReader from 'exifreader'
import { ExifData, ImageVersion, ExifTag } from '@/types/file'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import fs from 'fs/promises'
import path from 'path'

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
  let db;
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

    // Save files to disk
    const extension = metadata.format === 'jpeg' ? 'jpg' : (metadata.format || 'jpg');
    const originalFilename = `${fileId}.${extension}`;
    const optimizedFilename = `${fileId}_optimized.${extension}`;
    const minifiedFilename = `${fileId}_minified.${extension}`;
    const thumbFilename = `${fileId}_thumb.${extension}`;

    // Ensure directories exist
    await Promise.all([
      fs.mkdir(path.join(process.cwd(), 'public', 'photos', fileId), { recursive: true }),
      fs.mkdir(path.join(process.cwd(), 'public', 'photos', 'optimized'), { recursive: true }),
      fs.mkdir(path.join(process.cwd(), 'public', 'photos', 'minified'), { recursive: true }),
      fs.mkdir(path.join(process.cwd(), 'public', 'photos', 'thumb'), { recursive: true })
    ]);

    // Save files
    await Promise.all([
      fs.writeFile(path.join(process.cwd(), 'public', 'photos', fileId, originalFilename), buffer),
      fs.writeFile(path.join(process.cwd(), 'public', 'photos', 'optimized', optimizedFilename), optimizedData.buffer),
      fs.writeFile(path.join(process.cwd(), 'public', 'photos', 'minified', minifiedFilename), minifiedData.buffer),
      fs.writeFile(path.join(process.cwd(), 'public', 'photos', 'thumb', thumbFilename), thumbData.buffer)
    ]);

    // Insert into database
    try {
      db = await open({
        filename: './photo-phriend.db',
        driver: sqlite3.Database
      });
      console.log('Database opened successfully');

      await db.run('BEGIN TRANSACTION');

      // Insert main photo record
      const now = new Date().toISOString();
      await db.run(`
        INSERT INTO photos (
          id, filename, path, size, type, width, height, description, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        fileId,
        originalFilename,
        `/photos/${fileId}/${originalFilename}`,
        optimizedData.size,
        metadata.format || 'unknown',
        optimizedData.width,
        optimizedData.height,
        null, // description
        now,
        now
      ]);
      console.log('✓ Main photo record inserted');

      // Store raw EXIF data if available
      if (exifData?.rawExif) {
        await db.run(
          'INSERT INTO raw_exif (photo_id, exif_data) VALUES (?, ?)',
          [fileId, JSON.stringify(exifData.rawExif)]
        );
        console.log('✓ Raw EXIF data inserted');
      }

      // Store common EXIF data if available
      if (exifData) {
        await db.run(`
          INSERT INTO common_exif (
            photo_id, date_time, camera_make, camera_model, lens_info,
            focal_length, focal_length_35mm, aperture, shutter_speed, iso,
            exposure_program, exposure_mode, metering_mode, white_balance,
            flash, software, rating, copyright, artist
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          fileId,
          exifData.date && exifData.time ? `${exifData.date} ${exifData.time}` : null,
          exifData.make,
          exifData.model,
          exifData.lens,
          exifData.focalLength,
          exifData.focalLengthIn35mm,
          exifData.aperture,
          exifData.shutterSpeed,
          exifData.iso,
          null, // exposure_program
          exifData.exposureMode,
          exifData.meteringMode,
          exifData.whiteBalance,
          exifData.flash,
          exifData.software,
          null, // rating
          null, // copyright
          null  // artist
        ]);
        console.log('✓ Common EXIF data inserted');

        // Track EXIF tags if raw EXIF data is available
        if (exifData.rawExif) {
          for (const [tagName, tagData] of Object.entries(exifData.rawExif)) {
            if (tagData && typeof tagData === 'object' && 'id' in tagData) {
              const exifTag = tagData as unknown as ExifTag;
              const now = new Date().toISOString();
              await db.run(`
                INSERT INTO exif_tags (
                  tag_id, tag_name, data_type, description, group_name, 
                  frequency, created_at, last_used
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                ON CONFLICT(tag_id) DO UPDATE SET 
                frequency = frequency + 1,
                last_used = ?
              `, [
                exifTag.id,
                tagName,
                typeof exifTag.value,
                exifTag.description,
                null, // group_name
                now,
                now,
                now
              ]);
            }
          }
          console.log('✓ EXIF tags inserted/updated');
        }
      }

      // Insert photo versions
      const versions = [
        { type: 'optimized', data: optimizedData, filename: optimizedFilename },
        { type: 'minified', data: minifiedData, filename: minifiedFilename },
        { type: 'thumb', data: thumbData, filename: thumbFilename }
      ];

      for (const version of versions) {
        await db.run(`
          INSERT INTO photo_details (
            photo_id, version_type, name, size, type, path
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          fileId,
          version.type,
          version.filename,
          version.data.size,
          metadata.format || 'unknown',
          `/photos/${version.type}/${version.filename}`
        ]);
      }
      console.log('✓ Photo versions inserted');

      await db.run('COMMIT');
      console.log('✓ Database transaction committed');

      const result: OptimizationResult = {
        id: fileId,
        optimized: optimizedData,
        minified: minifiedData,
        thumb: thumbData,
        exif: exifData
      };

      return NextResponse.json(result);

    } catch (error) {
      console.error('Database operation failed:', error);
      if (db) {
        await db.run('ROLLBACK');
        try {
          await db.close();
          console.log('Database connection closed after error');
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in optimize endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  } finally {
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
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


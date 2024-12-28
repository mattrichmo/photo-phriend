import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { ExifData, ImageVersion, ExifTag } from '@/types/file';

interface InsertOptimizeParams {
  id: string;
  filename: string;
  type: string;
  optimized: ImageVersion;
  minified: ImageVersion;
  thumb: ImageVersion;
  exif: ExifData | null;
}

export async function insertOptimizedPhoto(data: InsertOptimizeParams) {
  let db;
  try {
    db = await open({
      filename: './db/photo-phriend.db',
      driver: sqlite3.Database
    });
    console.log('Database opened successfully');

    const { id, optimized, minified, thumb, exif } = data;
    console.log('Starting database insertions for photo:', id);

    // Insert main photo record
    const now = new Date().toISOString();
    try {
      await db.run(`
        INSERT INTO photos (
          id, filename, path, size, type, width, height, description, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.filename,
        `/photos/${id}/${data.filename}`,
        optimized.size,
        data.type,
        optimized.width,
        optimized.height,
        null, // description
        now,
        now
      ]);
      console.log('✓ Main photo record inserted');
    } catch (error) {
      console.error('Error inserting main photo record:', error);
      throw error;
    }

    // Store raw EXIF data if available
    if (exif?.rawExif) {
      try {
        await db.run(
          'INSERT INTO raw_exif (photo_id, exif_data) VALUES (?, ?)',
          [id, JSON.stringify(exif.rawExif)]
        );
        console.log('✓ Raw EXIF data inserted');
      } catch (error) {
        console.error('Error inserting raw EXIF data:', error);
        throw error;
      }
    }

    // Store common EXIF data if available
    if (exif) {
      try {
        await db.run(`
          INSERT INTO common_exif (
            photo_id, date_time, camera_make, camera_model, lens_info,
            focal_length, focal_length_35mm, aperture, shutter_speed, iso,
            exposure_program, exposure_mode, metering_mode, white_balance,
            flash, software, rating, copyright, artist
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          exif.date && exif.time ? `${exif.date} ${exif.time}` : null,
          exif.make,
          exif.model,
          exif.lens,
          exif.focalLength,
          exif.focalLengthIn35mm,
          exif.aperture,
          exif.shutterSpeed,
          exif.iso,
          null, // exposure_program
          exif.exposureMode,
          exif.meteringMode,
          exif.whiteBalance,
          exif.flash,
          exif.software,
          null, // rating
          null, // copyright
          null  // artist
        ]);
        console.log('✓ Common EXIF data inserted');
      } catch (error) {
        console.error('Error inserting common EXIF data:', error);
        throw error;
      }

      // Track EXIF tags if raw EXIF data is available
      if (exif.rawExif) {
        try {
          for (const [tagName, tagData] of Object.entries(exif.rawExif)) {
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
        } catch (error) {
          console.error('Error inserting EXIF tags:', error);
          throw error;
        }
      }
    }

    // Insert photo versions
    try {
      const versions = [
        { type: 'optimized', data: optimized },
        { type: 'minified', data: minified },
        { type: 'thumb', data: thumb }
      ];

      const rawExtension = data.filename.split('.').pop() || 'jpg';
      const extension = rawExtension === 'jpeg' ? 'jpg' : rawExtension;
      for (const version of versions) {
        await db.run(`
          INSERT INTO photo_details (
            photo_id, version_type, name, size, type, path
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          id,
          version.type,
          `${id}_${version.type}.${extension}`,
          version.data.size,
          data.type,
          `/photos/${version.type}/${id}_${version.type}.${extension}`
        ]);
      }
      console.log('✓ Photo versions inserted');
    } catch (error) {
      console.error('Error inserting photo versions:', error);
      throw error;
    }

    await db.close();
    console.log('✓ Database operations completed successfully');
    return { success: true, message: 'Photo data inserted successfully', id };

  } catch (error) {
    console.error('Database operation failed:', error);
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed after error');
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
    throw error;
  }
}

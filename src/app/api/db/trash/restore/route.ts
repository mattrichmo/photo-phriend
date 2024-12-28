import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { photoIds } = await request.json();
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty photoIds array' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      for (const photoId of photoIds) {
        // Get the trashed photo data
        const trashEntry = await db.get('SELECT * FROM trash WHERE photo_id = ?', photoId);
        if (!trashEntry) {
          throw new Error(`Photo ${photoId} not found in trash`);
        }

        const photoData = JSON.parse(trashEntry.photo_data);

        // Restore photo data
        await db.run(`
          INSERT OR REPLACE INTO photos (
            id, filename, path, size, type, width, height, description, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          photoData.photo.id,
          photoData.photo.filename,
          photoData.photo.path,
          photoData.photo.size,
          photoData.photo.type,
          photoData.photo.width,
          photoData.photo.height,
          photoData.photo.description,
          photoData.photo.createdAt,
          photoData.photo.updatedAt
        ]);

        // Restore EXIF data
        if (photoData.exif) {
          await db.run(`
            INSERT OR REPLACE INTO raw_exif (photo_id, exif_data)
            VALUES (?, ?)
          `, [photoId, photoData.exif.exif_data]);
        }

        // Restore common EXIF data
        if (photoData.commonExif) {
          const commonExif = photoData.commonExif;
          await db.run(`
            INSERT OR REPLACE INTO common_exif (
              photo_id, date_time, camera_make, camera_model, lens_info,
              focal_length, focal_length_35mm, aperture, shutter_speed, iso,
              exposure_program, exposure_mode, metering_mode, white_balance,
              flash, software, rating, copyright, artist
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            photoId, commonExif.date_time, commonExif.camera_make,
            commonExif.camera_model, commonExif.lens_info, commonExif.focal_length,
            commonExif.focal_length_35mm, commonExif.aperture,
            commonExif.shutter_speed, commonExif.iso, commonExif.exposure_program,
            commonExif.exposure_mode, commonExif.metering_mode,
            commonExif.white_balance, commonExif.flash, commonExif.software,
            commonExif.rating, commonExif.copyright, commonExif.artist
          ]);
        }

        // Restore photo details
        if (photoData.details) {
          for (const detail of photoData.details) {
            await db.run(`
              INSERT OR REPLACE INTO photo_details (
                photo_id, version_type, name, size, type, path
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              photoId, detail.version_type, detail.name,
              detail.size, detail.type, detail.path
            ]);
          }
        }

        // Restore keywords
        if (photoData.keywords) {
          for (const keyword of photoData.keywords) {
            // First ensure the keyword exists
            const keywordResult = await db.get(
              'SELECT id FROM keywords WHERE keyword = ?',
              keyword.keyword
            );
            
            let keywordId = keywordResult?.id;
            if (!keywordId) {
              const result = await db.run(
                'INSERT INTO keywords (keyword) VALUES (?)',
                keyword.keyword
              );
              keywordId = result.lastID;
            }

            // Then restore the photo-keyword relationship
            await db.run(`
              INSERT OR REPLACE INTO photo_keywords (photo_id, keyword_id)
              VALUES (?, ?)
            `, [photoId, keywordId]);
          }
        }

        // Remove from trash
        await db.run('DELETE FROM trash WHERE photo_id = ?', photoId);
      }

      await db.run('COMMIT');
      await db.close();

      return NextResponse.json({
        message: 'Photos restored successfully',
        restoredPhotos: photoIds
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error restoring photos:', error);
    return NextResponse.json(
      { error: 'Failed to restore photos' },
      { status: 500 }
    );
  }
} 
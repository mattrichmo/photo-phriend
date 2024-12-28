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
        // Get all photo data needed for restoration
        const photoData = await db.get('SELECT * FROM photos WHERE id = ?', photoId);
        const exifData = await db.get('SELECT * FROM raw_exif WHERE photo_id = ?', photoId);
        const commonExif = await db.get('SELECT * FROM common_exif WHERE photo_id = ?', photoId);
        const details = await db.all('SELECT * FROM photo_details WHERE photo_id = ?', photoId);
        const keywords = await db.all(`
          SELECT k.* FROM keywords k
          JOIN photo_keywords pk ON pk.keyword_id = k.id
          WHERE pk.photo_id = ?
        `, photoId);

        const completePhotoData = {
          photo: photoData,
          exif: exifData,
          commonExif: commonExif,
          details: details,
          keywords: keywords
        };

        const now = new Date();
        const autoDeleteDate = new Date(now);
        autoDeleteDate.setDate(autoDeleteDate.getDate() + 30);

        // Insert into trash
        await db.run(`
          INSERT INTO trash (
            photo_id,
            deleted_at,
            auto_delete_at,
            photo_data
          ) VALUES (?, ?, ?, ?)
        `, [
          photoId,
          now.toISOString(),
          autoDeleteDate.toISOString(),
          JSON.stringify(completePhotoData)
        ]);
      }

      await db.run('COMMIT');
      await db.close();

      return NextResponse.json({ 
        message: 'Photos moved to trash successfully',
        trashedPhotos: photoIds
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error moving photos to trash:', error);
    return NextResponse.json(
      { error: 'Failed to move photos to trash' },
      { status: 500 }
    );
  }
} 
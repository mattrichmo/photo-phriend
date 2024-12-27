import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    const { photoIds } = await request.json();
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty photoIds array' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    });

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      for (const photoId of photoIds) {
        // Get the photo data from trash to find file paths
        const trashEntry = await db.get('SELECT photo_data FROM trash WHERE photo_id = ?', photoId);
        if (!trashEntry) {
          console.warn(`Photo ${photoId} not found in trash`);
          continue;
        }

        const photoData = JSON.parse(trashEntry.photo_data);

        // Delete physical files
        try {
          // Delete original photo
          if (photoData.photo?.path) {
            await fs.unlink(path.join(process.cwd(), 'public', photoData.photo.path));
          }

          // Delete all versions (optimized, thumbnail, etc.)
          if (photoData.details) {
            for (const detail of photoData.details) {
              if (detail.path) {
                await fs.unlink(path.join(process.cwd(), 'public', detail.path));
              }
            }
          }
        } catch (error) {
          console.error(`Error deleting files for photo ${photoId}:`, error);
          // Continue with database cleanup even if file deletion fails
        }

        // Delete from trash table
        await db.run('DELETE FROM trash WHERE photo_id = ?', photoId);

        // Delete from all related tables (cleanup)
        await db.run('DELETE FROM photos WHERE id = ?', photoId);
        await db.run('DELETE FROM raw_exif WHERE photo_id = ?', photoId);
        await db.run('DELETE FROM common_exif WHERE photo_id = ?', photoId);
        await db.run('DELETE FROM photo_details WHERE photo_id = ?', photoId);
        await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', photoId);
      }

      await db.run('COMMIT');
      await db.close();

      return NextResponse.json({
        message: 'Photos permanently deleted successfully',
        deletedPhotos: photoIds
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error permanently deleting photos:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete photos' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';

interface PhotoDetail {
  version_type: string;
  path: string;
}

interface TrashPhotoData {
  photo: {
    id: string;
    details: {
      full: { path: string };
      optimized: { path: string } | null;
      minified: { path: string } | null;
      thumb: { path: string } | null;
    };
  };
  details: PhotoDetail[];
}

export async function GET() {
  try {
    const db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    });

    // Get all trash items
    const trashItems = await db.all(`
      SELECT * FROM trash
      ORDER BY deleted_at DESC
    `);

    // Process each item to extract needed data
    const processedItems = trashItems.map(item => {
      const photoData = JSON.parse(item.photo_data) as TrashPhotoData;
      return {
        id: item.photo_id,
        deleteDate: item.deleted_at,
        autoDeleteAt: item.auto_delete_at,
        details: {
          full: photoData.photo,
          optimized: photoData.details.find(d => d.version_type === 'optimized') || null,
          minified: photoData.details.find(d => d.version_type === 'minified') || null,
          thumb: photoData.details.find(d => d.version_type === 'thumb') || null
        }
      };
    });

    await db.close();

    return NextResponse.json({ images: processedItems });

  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trash' },
      { status: 500 }
    );
  }
}

// Auto-cleanup endpoint
export async function DELETE() {
  try {
    const db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    });

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Get items older than 30 days
      const oldItems = await db.all(`
        SELECT photo_id, photo_data
        FROM trash
        WHERE auto_delete_at <= datetime('now')
      `);

      for (const item of oldItems) {
        const photoData = JSON.parse(item.photo_data) as TrashPhotoData;

        // Delete physical files
        try {
          // Delete original photo
          if (photoData.photo.details.full?.path) {
            await fs.unlink(path.join(process.cwd(), 'public', photoData.photo.details.full.path));
          }

          // Delete all versions
          if (photoData.details) {
            for (const detail of photoData.details) {
              if (detail.path) {
                await fs.unlink(path.join(process.cwd(), 'public', detail.path));
              }
            }
          }
        } catch (error) {
          console.error(`Error deleting files for photo ${item.photo_id}:`, error);
        }

        // Delete from all tables
        await db.run('DELETE FROM trash WHERE photo_id = ?', item.photo_id);
        await db.run('DELETE FROM photos WHERE id = ?', item.photo_id);
        await db.run('DELETE FROM raw_exif WHERE photo_id = ?', item.photo_id);
        await db.run('DELETE FROM common_exif WHERE photo_id = ?', item.photo_id);
        await db.run('DELETE FROM photo_details WHERE photo_id = ?', item.photo_id);
        await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', item.photo_id);
      }

      await db.run('COMMIT');
      await db.close();

      return NextResponse.json({
        message: 'Auto-cleanup completed successfully',
        deletedCount: oldItems.length
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error during auto-cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform auto-cleanup' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    const photos = await db.all(
      `SELECT 
        p.*,
        thumb.path as thumb_path,
        thumb.width as thumb_width,
        thumb.height as thumb_height,
        opt.path as optimized_path,
        opt.width as optimized_width,
        opt.height as optimized_height
       FROM photos p
       JOIN photo_groups pg ON p.id = pg.photo_id
       LEFT JOIN photo_details thumb ON p.id = thumb.photo_id AND thumb.version_type = 'thumb'
       LEFT JOIN photo_details opt ON p.id = opt.photo_id AND opt.version_type = 'optimized'
       WHERE pg.group_id = ?
       ORDER BY pg.added_at DESC`,
      [groupId]
    );

    // Transform the flat results into nested structure
    const transformedPhotos = photos.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      details: {
        thumb: photo.thumb_path ? {
          path: photo.thumb_path,
          width: photo.thumb_width,
          height: photo.thumb_height
        } : null,
        optimized: {
          path: photo.optimized_path,
          width: photo.optimized_width,
          height: photo.optimized_height
        }
      }
    }));

    await db.close();

    return NextResponse.json({ photos: transformedPhotos });

  } catch (error) {
    console.error('Error fetching group photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group photos' },
      { status: 500 }
    );
  }
} 
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

    // Get the group details
    const group = await db.get(
      'SELECT * FROM groups WHERE id = ?',
      [groupId]
    );

    if (!group) {
      await db.close();
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Get all photos in this group with their details
    const photos = await db.all(
      `SELECT 
        p.id,
        p.filename,
        pd_thumb.path as thumb_path,
        pd_opt.path as optimized_path
       FROM photo_groups pg
       JOIN photos p ON pg.photo_id = p.id
       LEFT JOIN photo_details pd_thumb ON p.id = pd_thumb.photo_id AND pd_thumb.version_type = 'thumb'
       LEFT JOIN photo_details pd_opt ON p.id = pd_opt.photo_id AND pd_opt.version_type = 'optimized'
       WHERE pg.group_id = ?
       ORDER BY pg.added_at DESC`,
      [groupId]
    );

    // Transform the data to match the expected format
    const transformedPhotos = photos.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      details: {
        thumb: photo.thumb_path ? {
          path: photo.thumb_path
        } : null,
        optimized: {
          path: photo.optimized_path
        }
      }
    }));

    await db.close();

    return NextResponse.json({
      group,
      photos: transformedPhotos
    });

  } catch (error) {
    console.error('Error fetching group details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group details' },
      { status: 500 }
    );
  }
} 
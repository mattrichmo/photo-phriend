import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    let groups;
    if (id) {
      // Fetch single group with its first photo
      groups = await db.all(
        `SELECT 
          g.*,
          first_photos.photo_id as first_photo_id,
          first_photos.filename as first_photo_filename,
          pd.path as first_photo_thumb_path
        FROM groups g
        LEFT JOIN (
          SELECT 
            pg.group_id,
            pg.photo_id,
            p.filename,
            MIN(pg.added_at) as first_added
          FROM photo_groups pg
          JOIN photos p ON pg.photo_id = p.id
          GROUP BY pg.group_id
        ) first_photos ON g.id = first_photos.group_id
        LEFT JOIN photo_details pd 
          ON first_photos.photo_id = pd.photo_id 
          AND pd.version_type = 'thumb'
        WHERE g.id = ?`,
        [id]
      );
    } else {
      // Fetch all groups with their first photos
      groups = await db.all(
        `SELECT 
          g.*,
          first_photos.photo_id as first_photo_id,
          first_photos.filename as first_photo_filename,
          pd.path as first_photo_thumb_path
        FROM groups g
        LEFT JOIN (
          SELECT 
            pg.group_id,
            pg.photo_id,
            p.filename,
            MIN(pg.added_at) as first_added
          FROM photo_groups pg
          JOIN photos p ON pg.photo_id = p.id
          GROUP BY pg.group_id
        ) first_photos ON g.id = first_photos.group_id
        LEFT JOIN photo_details pd 
          ON first_photos.photo_id = pd.photo_id 
          AND pd.version_type = 'thumb'
        ORDER BY g.updated_at DESC`
      );
    }

    // Transform the data to include the first photo details
    const transformedGroups = groups.map(group => ({
      id: group.id,
      title: group.title,
      description: group.description,
      created_at: group.created_at,
      updated_at: group.updated_at,
      first_photo: group.first_photo_id ? {
        id: group.first_photo_id,
        filename: group.first_photo_filename,
        thumb_path: group.first_photo_thumb_path
      } : null
    }));

    await db.close();

    return NextResponse.json({ groups: transformedGroups });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
} 
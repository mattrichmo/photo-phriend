import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { groupId, photoIds } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    // If photoIds is provided, delete specific photos from the group
    // Otherwise, delete all photos from the group
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      const placeholders = photoIds.map(() => '?').join(',');
      const params = [groupId, ...photoIds];
      
      await db.run(
        `DELETE FROM photo_groups 
         WHERE group_id = ? AND photo_id IN (${placeholders})`,
        params
      );
    } else {
      await db.run(
        'DELETE FROM photo_groups WHERE group_id = ?',
        [groupId]
      );
    }

    await db.close();

    return NextResponse.json({
      message: 'Photos removed from group successfully'
    });

  } catch (error) {
    console.error('Error removing photos from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove photos from group' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { groupId, photoIds } = await request.json();

    if (!groupId || !photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Group ID and at least one photo ID are required' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    // Verify group exists
    const group = await db.get('SELECT id FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      await db.close();
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    
    // Insert all photo-group associations
    const stmt = await db.prepare(
      `INSERT OR IGNORE INTO photo_groups (photo_id, group_id, added_at)
       VALUES (?, ?, ?)`
    );

    for (const photoId of photoIds) {
      await stmt.run([photoId, groupId, now]);
    }

    await stmt.finalize();
    await db.close();

    return NextResponse.json({
      message: 'Photos added to group successfully'
    });

  } catch (error) {
    console.error('Error adding photos to group:', error);
    return NextResponse.json(
      { error: 'Failed to add photos to group' },
      { status: 500 }
    );
  }
}

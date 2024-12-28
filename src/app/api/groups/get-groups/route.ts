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
      // Fetch single group
      groups = await db.all(
        'SELECT * FROM groups WHERE id = ?',
        [id]
      );
    } else {
      // Fetch all groups
      groups = await db.all(
        'SELECT * FROM groups ORDER BY updated_at DESC'
      );
    }

    await db.close();

    return NextResponse.json({ groups });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Generate a random 5-digit ID
function generateGroupId(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    const now = new Date().toISOString();
    const groupId = generateGroupId();
    
    await db.run(
      `INSERT INTO groups (id, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [groupId, title, description || null, now, now]
    );

    await db.close();

    return NextResponse.json({
      message: 'Group created successfully',
      groupId: groupId
    });

  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

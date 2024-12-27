import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

interface UpdateKeywordsRequest {
  id: string;
  keywords: string[];
}

export async function POST(req: Request) {
  let db;
  try {
    const updates: UpdateKeywordsRequest = await req.json();

    // Open database connection
    db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    });

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // First, remove all existing keywords for this photo
      await db.run('DELETE FROM photo_keywords WHERE photo_id = ?', [updates.id]);

      // Then insert new keywords
      for (const keyword of updates.keywords) {
        // First ensure the keyword exists in keywords table
        let keywordId = await db.get('SELECT id FROM keywords WHERE keyword = ?', keyword);
        
        if (!keywordId) {
          // Insert new keyword
          const result = await db.run('INSERT INTO keywords (keyword) VALUES (?)', keyword);
          keywordId = { id: result.lastID };
        }

        // Link keyword to photo
        await db.run(
          'INSERT INTO photo_keywords (photo_id, keyword_id) VALUES (?, ?)',
          [updates.id, keywordId.id]
        );
      }

      await db.run('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;

      
    }
  } catch (error) {
    console.error('Error updating keywords:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update keywords' },
      { status: 500 }
    );
  } finally {
    if (db) {
      await db.close();
    }
  }
} 
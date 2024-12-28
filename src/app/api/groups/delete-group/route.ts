import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { groupIds } = await request.json();

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json(
        { error: 'Group IDs are required' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: path.join(process.cwd(), 'db/photo-phriend.db'),
      driver: sqlite3.Database
    });

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // First delete all photo associations for these groups
      const placeholders = groupIds.map(() => '?').join(',');
      await db.run(
        `DELETE FROM photo_groups WHERE group_id IN (${placeholders})`,
        groupIds
      );

      // Then delete the groups themselves
      const result = await db.run(
        `DELETE FROM groups WHERE id IN (${placeholders})`,
        groupIds
      );

      // Commit the transaction
      await db.run('COMMIT');
      await db.close();

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'No groups found to delete' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Groups deleted successfully'
      });

    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting groups:', error);
    return NextResponse.json(
      { error: 'Failed to delete groups' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function GET() {
  try {
    // Open SQLite database
    const db = await open({
      filename: './photo-phriend.db',
      driver: sqlite3.Database
    });

    // Create photos table (basic info only)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        filename TEXT,
        path TEXT,
        size INTEGER,
        type TEXT,
        width INTEGER,
        height INTEGER,
        description TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // Create raw_exif table to store complete EXIF data as JSON
    await db.exec(`
      CREATE TABLE IF NOT EXISTS raw_exif (
        photo_id TEXT PRIMARY KEY,
        exif_data JSON,
        FOREIGN KEY(photo_id) REFERENCES photos(id)
      );
    `);

    // Create exif_tags table to track known EXIF tags
    await db.exec(`
      CREATE TABLE IF NOT EXISTS exif_tags (
        tag_id TEXT PRIMARY KEY,    -- The hex ID (e.g., '0x9003')
        tag_name TEXT NOT NULL,     -- The name (e.g., 'DateTimeOriginal')
        data_type TEXT NOT NULL,    -- The EXIF data type (e.g., 'string', 'int16u', etc.)
        description TEXT,           -- Description of what the tag represents
        group_name TEXT,            -- The IFD group it belongs to
        frequency INTEGER DEFAULT 0, -- How many times this tag has been seen
        created_at TEXT,            -- When this tag was first encountered
        last_used TEXT             -- Last time this tag was seen in an image
      );
      CREATE INDEX IF NOT EXISTS idx_exif_tags_name ON exif_tags(tag_name);
    `);

    // Create common_exif table for frequently used EXIF data (for faster queries)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS common_exif (
        photo_id TEXT PRIMARY KEY,
        date_time TEXT,            -- DateTimeOriginal
        camera_make TEXT,          -- Make
        camera_model TEXT,         -- Model
        lens_info TEXT,            -- LensInfo
        focal_length TEXT,         -- FocalLength
        focal_length_35mm INTEGER, -- FocalLengthIn35mmFormat
        aperture TEXT,             -- FNumber
        shutter_speed TEXT,        -- ExposureTime
        iso INTEGER,               -- ISO
        exposure_program TEXT,     -- ExposureProgram
        exposure_mode TEXT,        -- ExposureMode
        metering_mode TEXT,        -- MeteringMode
        white_balance TEXT,        -- WhiteBalance
        flash TEXT,                -- Flash
        software TEXT,             -- Software
        rating INTEGER,            -- Rating
        copyright TEXT,            -- Copyright
        artist TEXT,               -- Artist
        FOREIGN KEY(photo_id) REFERENCES photos(id)
      );
    `);

    // Create details table for different image versions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photo_details (
        photo_id TEXT,
        version_type TEXT,
        name TEXT,
        size INTEGER,
        type TEXT,
        path TEXT,
        FOREIGN KEY(photo_id) REFERENCES photos(id),
        PRIMARY KEY(photo_id, version_type)
      );
    `);

    // Create keywords table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE
      );
    `);

    // Create photo_keywords junction table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photo_keywords (
        photo_id TEXT,
        keyword_id INTEGER,
        FOREIGN KEY(photo_id) REFERENCES photos(id),
        FOREIGN KEY(keyword_id) REFERENCES keywords(id),
        PRIMARY KEY(photo_id, keyword_id)
      );
    `);

    // Create trash table for storing deleted photos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trash (
        photo_id TEXT PRIMARY KEY,
        deleted_at TEXT NOT NULL,
        auto_delete_at TEXT NOT NULL,
        photo_data JSON NOT NULL,  -- Complete photo data for restoration
        FOREIGN KEY(photo_id) REFERENCES photos(id)
      );
      CREATE INDEX IF NOT EXISTS idx_trash_dates ON trash(deleted_at, auto_delete_at);
    `);

    await db.close();

    return NextResponse.json({ 
      message: 'Database and tables created successfully' 
    });

  } catch (error) {
    console.error('Database creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create database and tables' },
      { status: 500 }
    );
  }
}


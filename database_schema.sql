CREATE TABLE photos (
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
CREATE TABLE raw_exif (
        photo_id TEXT PRIMARY KEY,
        exif_data JSON,
        FOREIGN KEY(photo_id) REFERENCES photos(id)
      );
CREATE TABLE exif_tags (
        tag_id TEXT PRIMARY KEY,    -- The hex ID (e.g., '0x9003')
        tag_name TEXT NOT NULL,     -- The name (e.g., 'DateTimeOriginal')
        data_type TEXT NOT NULL,    -- The EXIF data type (e.g., 'string', 'int16u', etc.)
        description TEXT,           -- Description of what the tag represents
        group_name TEXT,            -- The IFD group it belongs to
        frequency INTEGER DEFAULT 0, -- How many times this tag has been seen
        created_at TEXT,            -- When this tag was first encountered
        last_used TEXT             -- Last time this tag was seen in an image
      );
CREATE INDEX idx_exif_tags_name ON exif_tags(tag_name);
CREATE TABLE common_exif (
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
CREATE TABLE photo_details (
        photo_id TEXT,
        version_type TEXT,
        name TEXT,
        size INTEGER,
        type TEXT,
        path TEXT,
        FOREIGN KEY(photo_id) REFERENCES photos(id),
        PRIMARY KEY(photo_id, version_type)
      );
CREATE TABLE keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE
      );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE photo_keywords (
        photo_id TEXT,
        keyword_id INTEGER,
        FOREIGN KEY(photo_id) REFERENCES photos(id),
        FOREIGN KEY(keyword_id) REFERENCES keywords(id),
        PRIMARY KEY(photo_id, keyword_id)
      );

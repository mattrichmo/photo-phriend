# Photo-Phriend Database Schema

## Core Tables

### photos
Main table storing basic photo information
- `id` TEXT PRIMARY KEY
- `filename` TEXT
- `path` TEXT
- `size` INTEGER
- `type` TEXT
- `width` INTEGER
- `height` INTEGER
- `description` TEXT
- `createdAt` TEXT
- `updatedAt` TEXT

## EXIF Data Tables

### raw_exif
Stores complete EXIF data as JSON
- `photo_id` TEXT PRIMARY KEY → references photos(id)
- `exif_data` JSON

### exif_tags
Tracks all known EXIF tags encountered
- `tag_id` TEXT PRIMARY KEY (e.g., '0x9003')
- `tag_name` TEXT NOT NULL (e.g., 'DateTimeOriginal')
- `data_type` TEXT NOT NULL (e.g., 'string', 'int16u')
- `description` TEXT
- `group_name` TEXT
- `frequency` INTEGER DEFAULT 0
- `created_at` TEXT
- `last_used` TEXT

*Indexes:*
- `idx_exif_tags_name` on `tag_name`

### common_exif
Frequently accessed EXIF data in structured form
- `photo_id` TEXT PRIMARY KEY → references photos(id)
- `date_time` TEXT (DateTimeOriginal)
- `camera_make` TEXT (Make)
- `camera_model` TEXT (Model)
- `lens_info` TEXT (LensInfo)
- `focal_length` TEXT (FocalLength)
- `focal_length_35mm` INTEGER (FocalLengthIn35mmFormat)
- `aperture` TEXT (FNumber)
- `shutter_speed` TEXT (ExposureTime)
- `iso` INTEGER (ISO)
- `exposure_program` TEXT
- `exposure_mode` TEXT
- `metering_mode` TEXT
- `white_balance` TEXT
- `flash` TEXT
- `software` TEXT
- `rating` INTEGER
- `copyright` TEXT
- `artist` TEXT

## Photo Versions

### photo_details
Stores different versions of photos (e.g., thumbnails, optimized)
- `photo_id` TEXT → references photos(id)
- `version_type` TEXT
- `name` TEXT
- `size` INTEGER
- `type` TEXT
- `path` TEXT

*Primary Key:* (photo_id, version_type)

## Keywords

### keywords
Master list of keywords
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `keyword` TEXT UNIQUE

### photo_keywords
Junction table linking photos to keywords
- `photo_id` TEXT → references photos(id)
- `keyword_id` INTEGER → references keywords(id)

*Primary Key:* (photo_id, keyword_id)

## Relationships

1. Each photo (photos) can have:
   - One raw EXIF entry (raw_exif)
   - One common EXIF entry (common_exif)
   - Multiple versions (photo_details)
   - Multiple keywords (through photo_keywords)

2. Each keyword (keywords) can be:
   - Associated with multiple photos (through photo_keywords)

3. EXIF tags (exif_tags) are independent and track all encountered tags 
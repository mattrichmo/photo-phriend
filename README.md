# Photo Phriend

![Photo Phriend Banner](public/assets/img/banner/photo-phriend-banner.webp)

A powerful local photo management application that helps you organize, optimize, and enhance your photo collection with AI-powered features. Designed to run locally but db can be hooked up easily to allow for cloud sync. No tracking, no ads, no data sharing, just a central place to manage your photos that you want to keep seperate from your existing cloud photo libraries.

## Features

### 📸 Intelligent Photo Management
- Local photo organization with SQLite database
- Comprehensive EXIF data tracking and management
- User-friendly gallery interface
- Bulk download functionality with ZIP file export

### 🔄 Automatic Photo Optimization
Creates four versions of each photo:
- **Original**: Preserves the untouched source file
- **Optimized**: Maintains EXIF data with 80% quality reduction
- **Minified**: 4x size reduction with optimization
- **Thumbnail**: 8x size reduction with optimization

### 🤖 AI-Powered Keywords
- Automatic keyword generation using OpenAI's vision models
- Supports both single image and batch processing
- Smart keyword organization and management

### 📝 Metadata Management
- View and edit EXIF data
- Manage photo descriptions and keywords using OpenAI or manually
- Track photo versions and modifications

### 📂 Grouping and Organization
- Create and manage groups of photos
- View and edit group details
- Organize photos into groups

## Saves all data to a local sqlite db in the folder. To initialize the database, run
``` bash
localhost:3000/api/db/create-sql-tables
```

## Screenshots

### Photos Page
![Photo Phriend Screenshot](public/assets/readme/screenshots/all-photos.png)

### Keywords Page
![Photo Phriend Screenshot](public/assets/readme/screenshots/keywords.png)

### Groups Page
![Photo Phriend Screenshot](public/assets/readme/screenshots/groups.png)




## Getting Started

### Prerequisites
- Node.js
- SQLite
- OpenAI API key

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/photo-phriend.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```
Add your OpenAI API key to the `.env` file.

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack
- Next.js
- SQLite
- OpenAI API
- TailwindCSS
- TypeScript

## Database Structure
The application uses SQLite to manage:
- Photo metadata and file information
- EXIF data in both raw and structured formats
- Photo versions and optimizations
- AI-generated keywords and relationships

## License
[MIT License](LICENSE)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.





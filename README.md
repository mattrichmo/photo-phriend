# Photo Phriend

![Photo Phriend Banner](public/assets/img/banner/photo-phriend-banner.webp)

A modern web application for optimizing and managing your photo collection. Built with Next.js, TypeScript, and Sharp. Designed to run locally to manage your image optimization in one place. Run npm run dev to start the server.

## Features

### Image Optimization
- Automatically creates multiple versions of each uploaded image:
  - Optimized: High-quality compressed version
  - Minified: Quarter-size version for faster loading
  - Thumbnail: Small preview version
- Preserves original image quality while reducing file size
- Displays optimization statistics (original size vs. optimized size)
- Shows percentage of storage savings for each image

### Image Management
- Gallery view with image previews
- Bulk selection of images
- Bulk operations:
  - Download multiple images as a ZIP file
  - Delete multiple images
  - Move to trash
  - Generate keywords for multiple images
- Individual image actions:
  - Download single image
  - Move to trash
  - Generate keywords
  - View full-size image in overlay

### Trash Management
- Dedicated trash page for deleted images
- Ability to restore images from trash
- Permanent deletion option
- Bulk restore and permanent delete operations

### Metadata & Keywords
- Advanced keyword management system:
  - Dedicated keywords page
  - View photos by keyword
  - Add/remove keywords from images
  - Bulk keyword operations
- Extracts and preserves EXIF data from images
- Stores important metadata in structured database:
  - Camera information
  - Lens details
  - Exposure settings
  - GPS coordinates (if available)
  - Date and time
- Support for image keywords/tags
- Ability to generate keywords for images that don't have them

### User Interface
- Clean, modern design
- Responsive layout
- Image grid with thumbnails
- Fullscreen image viewer
- Progress indicators for operations
- Bulk action toolbar
- Sort and filter capabilities
- Dedicated pages for:
  - Gallery
  - Optimization
  - Keywords
  - Trash

### Technical Features
- Server-side image processing
- SQLite database for efficient data management
- Structured EXIF data storage
- API endpoints for all operations
- TypeScript for type safety
- Modern React patterns and hooks
- Tailwind CSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## File Structure
```
public/
  ├── photos/         # Stored images
  │   ├── original/   # Original uploads
  │   ├── optimized/  # Optimized versions
  │   ├── minified/   # Minified versions
  │   └── thumb/      # Thumbnails
  └── photos.json     # Image metadata store

src/
  ├── app/           # Next.js app directory
  │   ├── api/       # API routes
  │   ├── gallery/   # Gallery page
  │   ├── optimize/  # Upload page
  │   ├── keywords/  # Keywords management
  │   └── trash/     # Trash management
  ├── components/    # React components
  ├── lib/          # Utility functions
  └── types/        # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

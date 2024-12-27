# Photo Phriend

![Photo Phriend Banner](assets/img/banner/photo-phriend-banner.webp)

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
  - Generate keywords for multiple images
- Individual image actions:
  - Download single image
  - Delete single image
  - Generate keywords
  - View full-size image in overlay

### Metadata & Keywords
- Extracts and preserves EXIF data from images
- Stores important metadata:
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

### Technical Features
- Server-side image processing
- Efficient file storage management
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

## API Endpoints

### Images
- `GET /api/images` - List all images
- `POST /api/optimize-image` - Upload and optimize a new image
- `POST /api/save-image` - Save an optimized image
- `GET /api/images/[id]/download` - Download a single image package
- `POST /api/images/download-zip` - Download multiple images as ZIP
- `DELETE /api/images/delete` - Delete one or more images

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
  │   └── optimize/  # Upload page
  ├── components/    # React components
  ├── lib/          # Utility functions
  └── types/        # TypeScript types
```

## Environment Variables

Create a `.env.local` file with the following variables:
```
# Add any required environment variables here
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

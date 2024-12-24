import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface UpdateKeywordsRequest {
  id: string;
  keywords: string[];
}

interface PhotoData {
  id: string;
  exif: Record<string, unknown> | null;
  details: {
    full: {
      name: string;
      size: number;
      type: string;
      path: string;
    };
    optimized: {
      name: string;
      size: number;
      type: string;
      path: string;
    };
    minified?: {
      name: string;
      size: number;
      type: string;
      path: string;
    };
    thumb?: {
      name: string;
      size: number;
      type: string;
      path: string;
    };
  };
  keywords: string[];
  createdAt: string;
}

export async function POST(req: Request) {
  try {
    const updates: UpdateKeywordsRequest = await req.json();

    // Read the current photos.json
    const photosPath = path.join(process.cwd(), 'public', 'photos.json');
    const photosContent = await fs.readFile(photosPath, 'utf-8');
    const photos = JSON.parse(photosContent);

    // Find and update the image
    const imageIndex = photos.images.findIndex((img: PhotoData) => img.id === updates.id);
    if (imageIndex === -1) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Update keywords
    photos.images[imageIndex].keywords = updates.keywords;

    // Write back to photos.json
    await fs.writeFile(photosPath, JSON.stringify(photos, null, 2));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating keywords:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update keywords' },
      { status: 500 }
    );
  }
} 
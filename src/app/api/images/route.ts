import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const photosJsonPath = path.join(process.cwd(), 'public', 'photos.json')
    let photos = []

    try {
      const photosData = await fs.readFile(photosJsonPath, 'utf-8')
      photos = JSON.parse(photosData)
    } catch (error) {
      // File doesn't exist or is invalid, return empty array
      console.error('Error reading photos.json:', error)
    }

    return NextResponse.json({ images: photos })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
} 
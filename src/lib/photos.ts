import fs from 'fs/promises'
import path from 'path'
import { FileData } from '@/types/file'

const PHOTOS_FILE = path.join(process.cwd(), 'public', 'photos.json')

export async function loadPhotos(): Promise<FileData[]> {
  const content = await fs.readFile(PHOTOS_FILE, 'utf-8')
  return JSON.parse(content)
}

export async function savePhotos(photos: FileData[]): Promise<void> {
  await fs.writeFile(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8')
} 
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileData } from '@/types/file'
import { X } from 'lucide-react'

interface TrashItem extends FileData {
  deleteDate: string
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
}

function getDaysRemaining(deleteDate: Date): number {
  const now = new Date()
  const thirtyDaysFromDelete = new Date(deleteDate)
  thirtyDaysFromDelete.setDate(thirtyDaysFromDelete.getDate() + 30)
  
  const diffInDays = Math.ceil((thirtyDaysFromDelete.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffInDays)
}

function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Will be deleted today'
  if (days === 1) return '1 day until deletion'
  return `${days} days until deletion`
}

export default function TrashPage() {
  const [images, setImages] = useState<TrashItem[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [viewingImage, setViewingImage] = useState<TrashItem | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/db/trash')
        if (!response.ok) throw new Error('Failed to fetch images')
        const data = await response.json()
        setImages(data.images)
      } catch (error) {
        console.error('Error fetching images:', error)
      }
    }

    fetchImages()
  }, [])

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map(img => img.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedImages(newSelected)
  }

  const handlePermanentDelete = async (imageIds: string[]) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/db/trash/delete-permanent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoIds: imageIds }),
      })

      if (!response.ok) throw new Error('Failed to delete images')

      // Remove deleted images from state
      setImages(prevImages => prevImages.filter(img => !imageIds.includes(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error deleting images:', error)
      alert('Failed to delete images permanently')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevert = async (imageIds: string[]) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/db/trash/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoIds: imageIds }),
      })

      if (!response.ok) throw new Error('Failed to revert images')

      // Remove reverted images from state
      setImages(prevImages => prevImages.filter(img => !imageIds.includes(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error reverting images:', error)
      alert('Failed to revert images')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Image Overlay */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full m-4">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20"
              onClick={() => setViewingImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative w-full h-full">
              <Image
                src={viewingImage.details.optimized.path}
                alt={`Full size view of ${viewingImage.details.full.name}`}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trash</h1>
        <div className="space-x-2">
          {selectedImages.size > 0 && (
            <>
              <Button
                onClick={() => handleRevert(Array.from(selectedImages))}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `Revert Selected (${selectedImages.size})`}
              </Button>
              <Button
                onClick={() => handlePermanentDelete(Array.from(selectedImages))}
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `Delete Selected Permanently (${selectedImages.size})`}
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedImages.size === images.length && images.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead>Auto-Delete</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => {
            const deleteDate = new Date(image.deleteDate)
            const daysRemaining = getDaysRemaining(deleteDate)
            
            return (
              <TableRow key={image.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedImages.has(image.id)}
                    onCheckedChange={() => toggleSelect(image.id)}
                  />
                </TableCell>
                <TableCell>
                  <div 
                    className="relative w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewingImage(image)}
                  >
                    {image.details.thumb?.path ? (
                      <Image 
                        src={image.details.thumb.path}
                        alt={image.details.full.name}
                        fill
                        className="object-contain rounded"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        No preview
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{image.details.full.name}</TableCell>
                <TableCell>{formatTimeAgo(deleteDate)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDaysRemaining(daysRemaining)}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    onClick={() => handleRevert([image.id])}
                    variant="outline"
                    size="sm"
                  >
                    Revert
                  </Button>
                  <Button
                    onClick={() => handlePermanentDelete([image.id])}
                    variant="destructive"
                    size="sm"
                  >
                    Delete Permanently
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

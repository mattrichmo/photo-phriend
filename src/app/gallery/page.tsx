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

export default function GalleryPage() {
  const [images, setImages] = useState<FileData[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [viewingImage, setViewingImage] = useState<FileData | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images')
        if (!response.ok) throw new Error('Failed to fetch images')
        const data = await response.json()
        setImages(data.images)
      } catch (error) {
        console.error('Error fetching images:', error)
      }
    }

    fetchImages()
  }, [])

  const handleDownload = async (image: FileData) => {
    try {
      const response = await fetch(`/api/images/${image.id}/download`)
      if (!response.ok) throw new Error('Failed to download image')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${image.details.full.name.split('.')[0]}_package.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image')
    }
  }

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

  const handleDelete = async (imageIds: string[]) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      })

      if (!response.ok) throw new Error('Failed to delete images')

      // Remove deleted images from state
      setImages(prevImages => prevImages.filter(img => !imageIds.includes(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error deleting images:', error)
      alert('Failed to delete images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDownload = async () => {
    try {
      setIsLoading(true)
      const selectedIds = Array.from(selectedImages)
      
      const response = await fetch('/api/images/download-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: selectedIds }),
      })

      if (!response.ok) throw new Error('Failed to download images')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `images-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading images:', error)
      alert('Failed to download images')
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
                alt={viewingImage.details.full.name}
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
        <h1 className="text-2xl font-bold">Optimized Images Gallery</h1>
        {selectedImages.size > 0 && (
          <div className="space-x-2">
            <Button
              onClick={handleBulkDownload}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Download Selected (${selectedImages.size})`}
            </Button>
            <Button
              onClick={() => handleDelete(Array.from(selectedImages))}
              variant="destructive"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Delete Selected (${selectedImages.size})`}
            </Button>
          </div>
        )}
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
            <TableHead>Original Size</TableHead>
            <TableHead>Optimized Size</TableHead>
            <TableHead>Savings</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.filter(image => image.details?.full && image.details?.optimized).map((image) => {
            const savings = ((image.details.full.size - image.details.optimized.size) / image.details.full.size * 100).toFixed(1)
            
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
                        className="object-cover rounded"
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
                <TableCell>{(image.details.full.size / 1024).toFixed(2)} KB</TableCell>
                <TableCell>
                  {image.details.optimized.size 
                    ? `${(image.details.optimized.size / 1024).toFixed(2)} KB`
                    : '-'
                  }
                </TableCell>
                <TableCell>{savings}%</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDownload(image)}
                    variant="outline"
                    size="sm"
                  >
                    Download
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
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

interface GalleryImage {
  id: string
  name: string
  size: number
  optimizedSize: number
  originalPath: string
  optimizedPath: string
  createdAt: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

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

  const handleDownload = async (image: GalleryImage) => {
    try {
      const response = await fetch(`/api/images/${image.id}/download`)
      if (!response.ok) throw new Error('Failed to download image')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${image.name.split('.')[0]}_optimized.jpg`
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
      
      // Request the server to create and send a zip file
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
      a.download = `optimized-images-${new Date().toISOString().split('T')[0]}.zip`
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
          {images.map((image) => {
            const savings = ((image.size - image.optimizedSize) / image.size * 100).toFixed(1)
            
            return (
              <TableRow key={image.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedImages.has(image.id)}
                    onCheckedChange={() => toggleSelect(image.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="relative w-16 h-16">
                    <Image 
                      src={image.optimizedPath}
                      alt={image.name}
                      fill
                      className="object-cover rounded"
                      sizes="64px"
                    />
                  </div>
                </TableCell>
                <TableCell>{image.name}</TableCell>
                <TableCell>{(image.size / 1024).toFixed(2)} KB</TableCell>
                <TableCell>
                  {image.optimizedSize 
                    ? `${(image.optimizedSize / 1024).toFixed(2)} KB`
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
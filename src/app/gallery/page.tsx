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
import { useRouter } from 'next/navigation'

export default function GalleryPage() {
  const router = useRouter()
  const [images, setImages] = useState<FileData[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [viewingImage, setViewingImage] = useState<FileData | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

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

  // Helper function to count selected images that need keywords
  const countSelectedImagesNeedingKeywords = () => {
    return Array.from(selectedImages).filter(id => {
      const image = images.find(img => img.id === id)
      return !image?.keywords || image.keywords.length === 0
    }).length
  }

  const handleGenerateKeywords = async (imageIds: string[]) => {
    if (imageIds.length === 0) return;

    // Check if it's a single image
    if (imageIds.length === 1) {
      const imageId = imageIds[0];
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      try {
        // Add image to loading state
        setLoadingImages(prev => new Set(prev).add(imageId));

        // Use the API key from the generate page
        const apiKey = localStorage.getItem('apiKey');
        if (!apiKey) throw new Error('API key not found');

        console.log('API Key:', apiKey);
        console.log('Image Path:', image.details.optimized.path);

        const response = await fetch('/api/generate-keywords-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            imagePath: image.details.optimized.path,
            imageId: image.id,
            apiKey,
          })
        });

        if (!response.ok) throw new Error('Failed to generate keywords');

        const data = await response.json();

        // Update the image keywords in the state
        setImages(prevImages => prevImages.map(img =>
          img.id === imageId ? { ...img, keywords: data.keywords } : img
        ));
      } catch (error) {
        console.error('Error generating keywords:', error);
        alert('Failed to generate keywords');
      } finally {
        // Remove image from loading state
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    } else {
      // Store the image information in localStorage for multiple images
      const imagesToProcess = imageIds
        .map(id => images.find(img => img.id === id))
        .filter(image => image && (!image.keywords || image.keywords.length === 0))
        .map(image => ({
          id: image!.id,
          name: image!.details.full.name,
          path: image!.details.optimized.path
        }));

      if (imagesToProcess.length === 0) return;

      localStorage.setItem('imagesForKeywords', JSON.stringify(imagesToProcess));
      router.push('/generate');
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
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
        <h1 className="text-2xl font-bold">All Photos</h1>
        <div className="space-x-2">
          {selectedImages.size > 0 && (
            <>
              {countSelectedImagesNeedingKeywords() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateKeywords(Array.from(selectedImages))}
                  disabled={selectedImages.size === 0}
                >
                  Generate Keywords ({countSelectedImagesNeedingKeywords()})
                </Button>
              )}
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
            <TableHead>Camera Info</TableHead>
            <TableHead>Exposure</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.filter(image => image.details?.full && image.details?.optimized).map((image) => (
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
                  onClick={() => setViewingImage(images.find(img => img.id === image.id) || null)}
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
              <TableCell>
                {image.exif ? (
                  <div className="space-y-1 text-sm">
                    <div>{image.exif.make} {image.exif.model}</div>
                    <div className="text-gray-500">{image.exif.lens}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">No camera info</div>
                )}
              </TableCell>
              <TableCell>
                {image.exif ? (
                  <div className="space-y-1 text-sm">
                    <div>ƒ/{image.exif.aperture}</div>
                    <div>{image.exif.shutterSpeed}s</div>
                    <div>ISO {image.exif.iso}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">No exposure info</div>
                )}
              </TableCell>
              <TableCell>
                {loadingImages.has(image.id) ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : image.keywords && image.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {expandedRows.has(image.id) ? (
                      image.keywords.map((keyword, index) => (
                        <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                          {keyword}
                        </div>
                      ))
                    ) : (
                      image.keywords.slice(0, 4).map((keyword, index) => (
                        <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                          {keyword}
                        </div>
                      ))
                    )}
                    {image.keywords.length > 4 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleRowExpansion(image.id)}
                      >
                        {expandedRows.has(image.id) ? 'See Less' : 'See More'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateKeywords([image.id])}
                  >
                    Generate Keywords
                  </Button>
                )}
              </TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
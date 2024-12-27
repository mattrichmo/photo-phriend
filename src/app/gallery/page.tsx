'use client'

import React from 'react'
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
import { FileData, FileVersion } from '@/types/file'
import { X, Table as TableIcon, Grid, LayoutGrid } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditData {
  keywords: string[]
  keywordsInput?: string
  copyright: string
  description: string
  make: string
  model: string
  lens: string
  aperture: string
  shutterSpeed: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [images, setImages] = useState<FileData[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [viewingImage, setViewingImage] = useState<FileData | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set())
  const [editData, setEditData] = useState<{ [key: string]: EditData }>({})
  const [viewMode, setViewMode] = useState<'table' | 'masonry' | 'masonry-zoomed'>('table')

  useEffect(() => {
    const fetchImages = async () => {
      try {
        console.log('Fetching images from API...')
        const response = await fetch('/api/db/get-photos')
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('API error response:', errorData)
          throw new Error(errorData.error || 'Failed to fetch images')
        }
        
        const data = await response.json()
        console.log(`Successfully fetched ${data.images.length} images`)
        setImages(data.images)
      } catch (error) {
        console.error('Error fetching images:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
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
      const response = await fetch('/api/db/trash/move-to-trash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoIds: imageIds }),
      })

      if (!response.ok) throw new Error('Failed to move images to trash')

      // Remove deleted images from state
      setImages(prevImages => prevImages.filter(img => !imageIds.includes(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error moving images to trash:', error)
      alert('Failed to move images to trash')
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

        const response = await fetch('/api/db/keywords/get-keywords-single', {
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
      router.push('/keywords');
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

  const toggleEditRow = (id: string) => {
    const newEditingRows = new Set(editingRows)
    if (newEditingRows.has(id)) {
      newEditingRows.delete(id)
    } else {
      newEditingRows.add(id)
      // Initialize edit data for this image
      const image = images.find(img => img.id === id)
      if (image) {
        setEditData(prev => ({
          ...prev,
          [id]: {
            keywords: [...(image.keywords || [])],
            keywordsInput: image.keywords?.join(', ') || '',
            copyright: image.exif?.copyright || '',
            description: image.exif?.description || '',
            make: image.exif?.make || '',
            model: image.exif?.model || '',
            lens: image.exif?.lens || '',
            aperture: image.exif?.aperture || '',
            shutterSpeed: image.exif?.shutterSpeed || ''
          }
        }))
      }
    }
    setEditingRows(newEditingRows)
  }

  const handleEditDataChange = (id: string, field: keyof EditData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleKeywordsChange = (id: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        keywordsInput: value,
        keywords: value.split(',').map(k => k.trim()).filter(Boolean)
      }
    }))
  }

  const handleSaveExif = async (id: string) => {
    try {
      setIsLoading(true)

      // First update the keywords
      const keywordsResponse = await fetch('/api/images/update-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          keywords: editData[id].keywords
        })
      })

      if (!keywordsResponse.ok) throw new Error('Failed to update keywords')

      // Then update the EXIF data
      const response = await fetch(`/api/images/${id}/edit-exif`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData[id])
      })

      if (!response.ok) throw new Error('Failed to update EXIF data')

      const updatedImage = await response.json()
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, ...updatedImage, keywords: editData[id].keywords } : img
      ))
      toggleEditRow(id)
    } catch (error) {
      console.error('Error updating EXIF:', error)
      alert('Failed to update EXIF data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">All Photos</h1>
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('masonry')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'masonry-zoomed' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2"
              onClick={() => setViewMode('masonry-zoomed')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
      
      {viewMode === 'table' ? (
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
              <React.Fragment key={image.id}>
                <TableRow>
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
                          image.keywords.map((keyword: string, index: number) => (
                            <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                              {keyword}
                            </div>
                          ))
                        ) : (
                          image.keywords.slice(0, 4).map((keyword: string, index: number) => (
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
                    <div className="space-x-2">
                      <Button
                        onClick={() => handleDownload(image)}
                        variant="outline"
                        size="sm"
                      >
                        Download
                      </Button>
                      <Button
                        onClick={() => toggleEditRow(image.id)}
                        variant="outline"
                        size="sm"
                      >
                        {editingRows.has(image.id) ? 'Close' : 'Edit'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {editingRows.has(image.id) && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={7}>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Image Files</h3>
                            <div className="space-y-2">
                              {Object.entries(image.details).map(([key, file]: [string, FileVersion]) => (
                                <div 
                                  key={key} 
                                  className="flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer group"
                                  onClick={() => {
                                    const a = document.createElement('a')
                                    a.href = file.path
                                    a.download = file.name
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium capitalize group-hover:underline">{key}</span>
                                    <span className="text-xs text-muted-foreground group-hover:underline">{formatFileSize(file.size)}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground group-hover:text-primary group-hover:underline">
                                    Click to download
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">EXIF Data</h3>
                            <div className="space-y-2">
                              <div>
                                <label className="text-sm">Keywords (comma-separated)</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded"
                                  value={editData[image.id]?.keywordsInput || ''}
                                  onChange={(e) => handleKeywordsChange(image.id, e.target.value)}
                                  placeholder="Enter keywords separated by commas"
                                />
                              </div>
                              <div>
                                <label className="text-sm">Copyright</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded"
                                  value={editData[image.id]?.copyright || ''}
                                  onChange={(e) => handleEditDataChange(image.id, 'copyright', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm">Description</label>
                                <textarea
                                  className="w-full p-2 border rounded"
                                  value={editData[image.id]?.description || ''}
                                  onChange={(e) => handleEditDataChange(image.id, 'description', e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm">Make</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={editData[image.id]?.make || ''}
                                    onChange={(e) => handleEditDataChange(image.id, 'make', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm">Model</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={editData[image.id]?.model || ''}
                                    onChange={(e) => handleEditDataChange(image.id, 'model', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-sm">Lens</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded"
                                  value={editData[image.id]?.lens || ''}
                                  onChange={(e) => handleEditDataChange(image.id, 'lens', e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm">Aperture</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={editData[image.id]?.aperture || ''}
                                    onChange={(e) => handleEditDataChange(image.id, 'aperture', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm">Shutter Speed</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={editData[image.id]?.shutterSpeed || ''}
                                    onChange={(e) => handleEditDataChange(image.id, 'shutterSpeed', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button
                                onClick={() => handleSaveExif(image.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'masonry' ? 'grid-cols-6' : 'grid-cols-3'}`}>
          {images.filter(image => image.details?.full && image.details?.optimized).map((image) => (
            <div 
              key={image.id} 
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              onClick={() => setViewingImage(image)}
            >
              <Image
                src={image.details.optimized.path}
                alt={image.details.full.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes={viewMode === 'masonry' ? '(max-width: 1280px) 16vw, 200px' : '(max-width: 1280px) 33vw, 400px'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm truncate">{image.details.full.name}</p>
                  {image.keywords && image.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {image.keywords.slice(0, 3).map((keyword, index) => (
                        <span key={index} className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          {keyword}
                        </span>
                      ))}
                      {image.keywords.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          +{image.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Checkbox
                checked={selectedImages.has(image.id)}
                onCheckedChange={() => toggleSelect(image.id)}
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
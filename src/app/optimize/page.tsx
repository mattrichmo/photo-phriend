'use client'

import { FileUpload } from "@/components/FileUpload"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'

interface UploadFile extends File {
  path: string;
}

interface ProcessingFile {
  id: string;
  file: UploadFile;
  isOptimizing: boolean;
  optimizationError?: string;
  details: {
    full: {
      name: string;
      size: number;
      type: string;
      path: string;
    };
    optimized?: {
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
  exif: {
    latitude: number;
    longitude: number;
    altitude: number;
    date: string;
    time: string;
    camera: string;
    lens: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
  } | null;
  keywords: string[];
}

export default function OptimizePage() {
  const [files, setFiles] = useState<ProcessingFile[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const handleFilesSelected = async (selectedFiles: File[]) => {
    // Validate files on client side
    const validFiles = selectedFiles.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has invalid type (allowed: JPG, PNG, GIF, WebP)`)
        return false
      }
      
      return true
    })

    const newFiles: ProcessingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: Object.assign(file, { path: URL.createObjectURL(file) }) as UploadFile,
      isOptimizing: false,
      details: {
        full: {
          name: file.name,
          size: file.size,
          type: file.type,
          path: URL.createObjectURL(file),
        }
      },
      exif: null,
      keywords: []
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const optimizeImage = async (file: ProcessingFile) => {
    try {
      // Optimize the image using the new endpoint
      const optimizeFormData = new FormData()
      optimizeFormData.append('file', file.file)
      optimizeFormData.append('fileId', file.id)

      const response = await fetch('/api/db/optimize', {
        method: 'POST',
        body: optimizeFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize image')
      }

      const { optimized, minified, thumb, exif } = result

      // Create object URLs for the processed images
      const optimizedBlob = new Blob([Uint8Array.from(optimized.buffer.data)])
      const minifiedBlob = new Blob([Uint8Array.from(minified.buffer.data)])
      const thumbBlob = new Blob([Uint8Array.from(thumb.buffer.data)])

      return {
        optimizedPath: URL.createObjectURL(optimizedBlob),
        optimizedSize: optimized.size,
        minifiedPath: URL.createObjectURL(minifiedBlob),
        minifiedSize: minified.size,
        thumbPath: URL.createObjectURL(thumbBlob),
        thumbSize: thumb.size,
        exif
      }
    } catch (error) {
      console.error(`Error optimizing ${file.details.full.name}:`, error)
      throw error
    }
  }

  const handleOptimizeAll = async () => {
    setIsOptimizing(true)

    try {
      const updatedFiles = [...files]
      
      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i]
        if (file.details.optimized?.path) continue // Skip if already optimized

        file.isOptimizing = true
        setFiles([...updatedFiles])

        try {
          const { 
            optimizedPath, 
            optimizedSize, 
            minifiedPath, 
            minifiedSize, 
            thumbPath, 
            thumbSize,
            exif 
          } = await optimizeImage(file)
          
          updatedFiles[i] = {
            ...file,
            exif,
            details: {
              ...file.details,
              optimized: {
                name: `${file.id}_optimized.jpg`,
                size: optimizedSize,
                type: 'image/jpeg',
                path: optimizedPath,
              },
              minified: {
                name: `${file.id}_minified.jpg`,
                size: minifiedSize,
                type: 'image/jpeg',
                path: minifiedPath,
              },
              thumb: {
                name: `${file.id}_thumb.jpg`,
                size: thumbSize,
                type: 'image/jpeg',
                path: thumbPath,
              }
            },
            isOptimizing: false,
          }
        } catch (error) {
          console.error('Failed to optimize:', error)
          updatedFiles[i] = {
            ...file,
            optimizationError: 'Failed to optimize',
            isOptimizing: false,
          }
        }

        setFiles([...updatedFiles])
      }
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleDownloadAll = async () => {
    if (files.length === 0) {
      alert('No files to download')
      return
    }

    const zip = new JSZip()
    const originalFolder = zip.folder('original')
    const optimizedFolder = zip.folder('optimized')

    // Add all files to the zip
    for (const fileData of files) {
      try {
        // Add original file
        const originalResponse = await fetch(fileData.details.full.path)
        const originalBlob = await originalResponse.blob()
        originalFolder?.file(fileData.details.full.name, originalBlob)

        // Add optimized file if it exists
        if (fileData.details.optimized?.path) {
          const optimizedResponse = await fetch(fileData.details.optimized.path)
          const optimizedBlob = await optimizedResponse.blob()
          optimizedFolder?.file(`${fileData.id}_optimized.jpg`, optimizedBlob)
        }
      } catch (error) {
        console.error(`Error adding ${fileData.details.full.name} to zip:`, error)
      }
    }

    // Generate and download the zip file
    try {
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'images.zip')
    } catch (error) {
      console.error('Error generating zip file:', error)
      alert('Failed to create zip file')
    }
  }

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleDownloadSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('No files selected')
      return
    }

    const zip = new JSZip()
    const originalFolder = zip.folder('original')
    const optimizedFolder = zip.folder('optimized')

    // Add selected files to the zip
    for (const fileData of files) {
      if (!selectedFiles.has(fileData.id)) continue

      try {
        // Add original file
        const originalResponse = await fetch(fileData.details.full.path)
        const originalBlob = await originalResponse.blob()
        originalFolder?.file(fileData.details.full.name, originalBlob)

        // Add optimized file if it exists
        if (fileData.details.optimized?.path) {
          const optimizedResponse = await fetch(fileData.details.optimized.path)
          const optimizedBlob = await optimizedResponse.blob()
          optimizedFolder?.file(`${fileData.id}_optimized.jpg`, optimizedBlob)
        }
      } catch (error) {
        console.error(`Error adding ${fileData.details.full.name} to zip:`, error)
      }
    }

    // Generate and download the zip file
    try {
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'selected_images.zip')
    } catch (error) {
      console.error('Error generating zip file:', error)
      alert('Failed to create zip file')
    }
  }

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) {
      alert('No files selected')
      return
    }

    setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)))
    setSelectedFiles(new Set())
  }

  const allFilesOptimized = files.length > 0 && files.every(file => file.details.optimized?.path && !file.isOptimizing)

  return (
    <div className="space-y-6">
      <FileUpload onFilesSelected={handleFilesSelected} />
      
      {files.length > 0 && (
        <div className="flex justify-end gap-4">
          {selectedFiles.size > 0 ? (
            <>
              {Array.from(selectedFiles).every(id => 
                files.find(f => f.id === id)?.details.optimized?.path && !files.find(f => f.id === id)?.isOptimizing
              ) ? (
                <Button 
                  onClick={handleDownloadSelected}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Download ({selectedFiles.size})
                </Button>
              ) : (
                // Only show Remove button if ANY selected file is not yet optimized
                Array.from(selectedFiles).some(id => !files.find(f => f.id === id)?.details.optimized?.path) && (
                  <Button 
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove ({Array.from(selectedFiles).filter(id => 
                      !files.find(f => f.id === id)?.details.optimized?.path
                    ).length})
                  </Button>
                )
              )}
            </>
          ) : allFilesOptimized && (
            <Button 
              onClick={handleDownloadAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Download All
            </Button>
          )}
          <Button 
            onClick={handleOptimizeAll}
            className="bg-green-600 hover:bg-green-700"
            disabled={isOptimizing || allFilesOptimized}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize All'}
          </Button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Select</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Original Size</TableHead>
            <TableHead>Optimized Size</TableHead>
            <TableHead>Savings</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id} className="hover:bg-gray-50">
              <TableCell className="relative">
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={() => handleSelectFile(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="data-[state=checked]:bg-blue-600"
                />
              </TableCell>
              <TableCell>
                <div className="relative w-16 h-16">
                  <Image
                    src={file.details.full.path}
                    alt={file.details.full.name}
                    fill
                    className="object-cover rounded"
                    sizes="64px"
                  />
                </div>
              </TableCell>
              <TableCell>{file.details.full.name}</TableCell>
              <TableCell>{(file.details.full.size / 1024).toFixed(2)} KB</TableCell>
              <TableCell>
                {file.details.optimized?.size 
                  ? `${(file.details.optimized.size / 1024).toFixed(2)} KB`
                  : '-'
                }
              </TableCell>
              <TableCell>
                {file.details.optimized?.size 
                  ? `${(((file.details.full.size - file.details.optimized.size) / file.details.full.size) * 100).toFixed(1)}%`
                  : '-'
                }
              </TableCell>
              <TableCell>
                {file.isOptimizing 
                  ? 'Optimizing...'
                  : file.optimizationError
                  ? file.optimizationError
                  : file.details.optimized?.path
                  ? 'Optimized'
                  : 'Pending'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 


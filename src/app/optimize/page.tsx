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
import { FileData } from "@/types/file"
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'

export default function OptimizePage() {
  const [files, setFiles] = useState<FileData[]>([])
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

    const newFiles: FileData[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      path: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      file: file,
      isOptimizing: false
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const optimizeImage = async (file: FileData) => {
    try {
      // First, save the original file
      const originalFormData = new FormData()
      originalFormData.append('file', file.file)
      originalFormData.append('type', 'original')
      originalFormData.append('filename', file.name)

      const saveOriginalResponse = await fetch('/api/save-image', {
        method: 'POST',
        body: originalFormData,
      })

      if (!saveOriginalResponse.ok) {
        throw new Error('Failed to save original image')
      }

      // Then optimize the image
      const optimizeFormData = new FormData()
      optimizeFormData.append('file', file.file)

      const response = await fetch('/api/optimize-image', {
        method: 'POST',
        body: optimizeFormData,
      })

      if (!response.ok) throw new Error('Failed to optimize image')

      const optimizedBlob = await response.blob()
      const optimizedPath = URL.createObjectURL(optimizedBlob)

      // Save the optimized file
      const optimizedFormData = new FormData()
      optimizedFormData.append('file', new File([optimizedBlob], `${file.name.split('.')[0]}_optimized.jpg`, { type: 'image/jpeg' }))
      optimizedFormData.append('type', 'optimized')
      optimizedFormData.append('filename', file.name)
      optimizedFormData.append('originalSize', file.size.toString())
      optimizedFormData.append('optimizedSize', optimizedBlob.size.toString())
      optimizedFormData.append('id', file.id)

      const saveOptimizedResponse = await fetch('/api/save-image', {
        method: 'POST',
        body: optimizedFormData,
      })

      if (!saveOptimizedResponse.ok) {
        throw new Error('Failed to save optimized image')
      }

      return {
        optimizedPath,
        optimizedSize: optimizedBlob.size,
      }
    } catch (error) {
      console.error(`Error optimizing ${file.name}:`, error)
      throw error
    }
  }

  const handleOptimizeAll = async () => {
    setIsOptimizing(true)

    try {
      const updatedFiles = [...files]
      
      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i]
        if (file.optimizedPath) continue // Skip if already optimized

        file.isOptimizing = true
        setFiles([...updatedFiles])

        try {
          const { optimizedPath, optimizedSize } = await optimizeImage(file)
          updatedFiles[i] = {
            ...file,
            optimizedPath,
            optimizedSize,
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
        const originalResponse = await fetch(fileData.path)
        const originalBlob = await originalResponse.blob()
        originalFolder?.file(fileData.name, originalBlob)

        // Add optimized file if it exists
        if (fileData.optimizedPath) {
          const optimizedResponse = await fetch(fileData.optimizedPath)
          const optimizedBlob = await optimizedResponse.blob()
          const optimizedName = `${fileData.name.split('.')[0]}_optimized.jpg`
          optimizedFolder?.file(optimizedName, optimizedBlob)
        }
      } catch (error) {
        console.error(`Error adding ${fileData.name} to zip:`, error)
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
        const originalResponse = await fetch(fileData.path)
        const originalBlob = await originalResponse.blob()
        originalFolder?.file(fileData.name, originalBlob)

        // Add optimized file if it exists
        if (fileData.optimizedPath) {
          const optimizedResponse = await fetch(fileData.optimizedPath)
          const optimizedBlob = await optimizedResponse.blob()
          const optimizedName = `${fileData.name.split('.')[0]}_optimized.jpg`
          optimizedFolder?.file(optimizedName, optimizedBlob)
        }
      } catch (error) {
        console.error(`Error adding ${fileData.name} to zip:`, error)
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

  const allFilesOptimized = files.length > 0 && files.every(file => file.optimizedPath && !file.isOptimizing)

  return (
    <div className="space-y-6">
      <FileUpload onFilesSelected={handleFilesSelected} />
      
      {files.length > 0 && (
        <div className="flex justify-end gap-4">
          {selectedFiles.size > 0 ? (
            <>
              {Array.from(selectedFiles).every(id => 
                files.find(f => f.id === id)?.optimizedPath && !files.find(f => f.id === id)?.isOptimizing
              ) ? (
                <Button 
                  onClick={handleDownloadSelected}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Download ({selectedFiles.size})
                </Button>
              ) : (
                // Only show Remove button if ANY selected file is not yet optimized
                Array.from(selectedFiles).some(id => !files.find(f => f.id === id)?.optimizedPath) && (
                  <Button 
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove ({Array.from(selectedFiles).filter(id => 
                      !files.find(f => f.id === id)?.optimizedPath
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
                    src={file.path}
                    alt={file.name}
                    fill
                    className="object-cover rounded"
                    sizes="64px"
                  />
                </div>
              </TableCell>
              <TableCell>{file.name}</TableCell>
              <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
              <TableCell>
                {file.optimizedSize 
                  ? `${(file.optimizedSize / 1024).toFixed(2)} KB`
                  : '-'
                }
              </TableCell>
              <TableCell>
                {file.isOptimizing 
                  ? 'Optimizing...'
                  : file.optimizationError
                  ? file.optimizationError
                  : file.optimizedPath
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
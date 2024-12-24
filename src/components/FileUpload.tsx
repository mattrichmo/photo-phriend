'use client'

import { ChangeEvent } from 'react'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      onFilesSelected(filesArray)
    }
  }

  return (
    <div className="w-full">
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        accept="image/*"
      />
    </div>
  )
} 
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files')

    // Validate files
    const validatedFiles = files.filter((file) => {
      const f = file as File
      // Max size: 5MB
      const maxSize = 5 * 1024 * 1024
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      
      if (f.size > maxSize) {
        console.warn(`File ${f.name} is too large`)
        return false
      }
      
      if (!allowedTypes.includes(f.type)) {
        console.warn(`File ${f.name} has invalid type`)
        return false
      }
      
      return true
    })

    return NextResponse.json({ 
      message: 'Files validated successfully',
      files: validatedFiles.map(file => ({
        name: (file as File).name,
        type: (file as File).type,
        size: (file as File).size
      }))
    })
  } catch (error) {
    console.error('Failed to process files:', error)
    return NextResponse.json(
      { error: 'Failed to process files' },
      { status: 500 }
    )
  }
} 
export interface FileData {
  id: string
  name: string
  path: string
  size: number
  type: string
  file: File
  optimizedPath?: string
  optimizedSize?: number
  isOptimizing?: boolean
  optimizationError?: string
}


export interface FileData {
  id: string,
  exif: {
    latitude: number,
    longitude: number,
    altitude: number,
    date: string,
    time: string,
    camera: string,
    make: string,
    model: string,
    lens: string,
    aperture: string,
    shutterSpeed: string,
    iso: string,
  } | null
  details: {
    full: {
      name: string,
      size: number,
      type: string,
      path: string,
    },
    optimized: {
      name: string,
      size: number,
      type: string,
      path: string,
    },
    minified: {
      name: string,
      size: number,
      type: string,
      path: string,
    },
    thumb: {
      name: string,
      size: number,
      type: string,
      path: string,
    }
  },
  keywords: string[],
  optimizedPath?: string
  optimizedSize?: number
  isOptimizing?: boolean
  optimizationError?: string
}
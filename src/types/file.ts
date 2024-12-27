export interface FileVersion {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface FileDetails {
  full: FileVersion;
  optimized: FileVersion;
  minified: FileVersion;
  thumb: FileVersion;
}

export interface ImageVersion {
  buffer: Buffer;
  size: number;
  width: number;
  height: number;
}

// ExifReader types
export interface ExifValue {
  id: number;
  value: unknown;
  description?: string;
}

export interface ExifTag extends ExifValue {
  type?: string;
  group?: string;
}

export type Tags = Record<string, ExifTag>;

export interface ExifData {
  // Camera Info
  make?: string;
  model?: string;
  lens?: string;
  
  // Exposure Info
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  
  // GPS Data
  latitude?: number;
  longitude?: number;
  altitude?: number;
  
  // Timestamps
  date?: string;
  time?: string;
  
  // Image Details
  width?: number;
  height?: number;
  resolution?: {
    x: number;
    y: number;
    unit: string;
  };
  
  // Additional Metadata
  software?: string;
  exposureMode?: string;
  whiteBalance?: string;
  focalLengthIn35mm?: number;
  colorSpace?: string;
  meteringMode?: string;
  flash?: string;
  contrast?: string;
  saturation?: string;
  sharpness?: string;
  
  // User Editable Fields
  copyright?: string;
  description?: string;
  
  // Raw EXIF data for storage
  rawExif?: Record<string, unknown>;
}

export interface FileData {
  id: string;
  details: FileDetails;
  exif: ExifData | null;
  keywords?: string[];
}
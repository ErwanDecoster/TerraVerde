export interface GardenData {
  id: string
  name: string
  background_image_url: string
  pixels_per_meters: number
  is_public: boolean
  created_at: string
  updated_at: string
  description?: string | null
  zip_code?: string | null
  country?: string | null
  city?: string | null
  street_address?: string | null
}

export interface GardenPosition {
  x: number
  y: number
}

export interface GardenFormData {
  name: string
  isPublic: boolean
  backgroundImage: File
  PixelsPerMeters: number
  description?: string | null
  zip_code?: string | null
  country?: string | null
  city?: string | null
  street_address?: string | null
}

export interface GardenUpdateFormData {
  name: string
  isPublic: boolean
  backgroundImage?: File
  PixelsPerMeters: number
  description?: string | null
  zip_code?: string | null
  country?: string | null
  city?: string | null
  street_address?: string | null
}

export interface GardenData {
  id: string
  name: string
  user_id: string
  background_image_url: string
  pixels_per_meters: number
  is_public: boolean
  show_markers_letters?: boolean
  created_at: string
  updated_at: string
  description?: string | null
  zip_code?: string | null
  country?: string | null
  street_name?: string | null
  street_number?: string | null
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
  street_name?: string | null
  street_number?: string | null
}

export interface GardenUpdateFormData {
  name: string
  isPublic: boolean
  backgroundImage?: File
  PixelsPerMeters: number
  showMarkersLetters: boolean
  description?: string | null
  zip_code?: string | null
  country?: string | null
  street_name?: string | null
  street_number?: string | null
}

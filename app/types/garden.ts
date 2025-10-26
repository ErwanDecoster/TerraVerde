export interface GardenData {
  id: string
  name: string
  user_id: string
  x_position?: number
  y_position?: number
  background_image_url: string
  image_width: number
  image_height: number
  default_zoom: number
  min_zoom: number
  max_zoom: number
  pixels_per_meters: number
  is_public: boolean
  created_at: string
  updated_at: string
  imagePath: string
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
}

export interface GardenUpdateFormData {
  name: string
  isPublic: boolean
  backgroundImage?: File
  PixelsPerMeters: number
}

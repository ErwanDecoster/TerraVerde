// Types for Garden/Map management

export interface GardenData {
  id: string
  name: string
  x_position?: number
  y_position?: number
  background_color: string
  background_image_url: string
  image_width: number
  image_height: number
  default_zoom: number
  min_zoom: number
  max_zoom: number
  pixels_per_meters: number
  created_at: string
  updated_at: string
  imagePath: string
}

export interface GardenPosition {
  x: number
  y: number
}

// Form data types
export interface GardenFormData {
  name: string
  position: GardenPosition
  backgroundColor: string
  backgroundImage: File
  PixelsPerMeters: number
}

// Update form data types (backgroundImage is optional)
export interface GardenUpdateFormData {
  name: string
  position: GardenPosition
  backgroundColor: string
  backgroundImage?: File
  PixelsPerMeters: number
}

export interface GardenTeamMemberProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  website?: string | null
  is_public?: boolean | null
}

export interface GardenTeamMember {
  id: string
  team_id: string
  profile_id: string
  role: string
  created_at: string
  updated_at: string
  profile: GardenTeamMemberProfile
}

export interface GardenTeam {
  id: string
  garden_id: string
  team_name: string
  created_at: string
  updated_at: string
  teams_members: GardenTeamMember[]
}

export type VarietyFilterMode = 'garden' | 'public' | 'all'

export interface GardenData {
  id: string
  name: string
  background_image_url: string
  pixels_per_meters: number
  is_public: boolean
  variety_filter_mode: VarietyFilterMode
  created_at: string
  updated_at: string
  description?: string | null
  zip_code?: string | null
  country?: string | null
  city?: string | null
  street_address?: string | null
  teams?: GardenTeam[]
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
  variety_filter_mode: VarietyFilterMode
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
  variety_filter_mode: VarietyFilterMode
  description?: string | null
  zip_code?: string | null
  country?: string | null
  city?: string | null
  street_address?: string | null
}

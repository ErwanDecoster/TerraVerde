export interface ProfileData {
  id: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  website?: string | null
  is_public?: boolean | null
}

export interface ProfileFormData {
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  website?: string | null
  is_public?: boolean
}

export interface ProfileUpdateFormData {
  first_name?: string | null
  last_name?: string | null
  avatar_file?: File
  bio?: string | null
  website?: string | null
  is_public?: boolean
}

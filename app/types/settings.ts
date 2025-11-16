export interface SettingsData {
  id: string
  created_at: string
  updated_at: string
  show_markers_letters?: boolean | null
  default_color_theme?: string | null
  language?: string | null
  preferred_units?: string | null
  timezone?: string | null
}

export interface SettingsUpdateFormData {
  show_markers_letters?: boolean | null
  default_color_theme?: string | null
  language?: string | null
  preferred_units?: string | null
  timezone?: string | null
}

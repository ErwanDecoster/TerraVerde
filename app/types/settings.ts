export interface SettingsData {
  id: string;
  created_at: string;
  updated_at: string;
  show_markers_letters?: boolean | null;
  show_real_plant_size?: boolean | null;
  show_small_plants_on_top?: boolean | null;
  default_color_theme?: string | null;
  language?: string | null;
  preferred_units?: string | null;
  timezone?: string | null;
}

export interface SettingsUpdateFormData {
  show_markers_letters?: boolean | null;
  show_real_plant_size?: boolean | null;
  show_small_plants_on_top?: boolean | null;
  default_color_theme?: string | null;
  language?: string | null;
  preferred_units?: string | null;
  timezone?: string | null;
}

export const DEFAULT_SHOW_REAL_PLANT_SIZE = true;
export const DEFAULT_SHOW_SMALL_PLANTS_ON_TOP = true;

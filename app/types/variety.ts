export type PlantCategory = 'tree' | 'fruit_tree' | 'shrub' | 'flower' | 'climber' | 'vegetable' | 'grass' | 'aquatic' | 'other'

export interface VarietyData {
  id: string
  name: string
  scientific_name?: string | null
  harvest_period?: string | null
  main_color?: string | null
  reference_url?: string | null
  category: PlantCategory
  created_at: string
  user_id: string
  garden_id?: string | null
  is_public: boolean
}

export interface VarietyFormData {
  name: string
  scientific_name?: string
  harvest_period?: string
  main_color?: string
  reference_url?: string
  category: PlantCategory
  user_id?: string
  garden_id?: string | null
  is_public?: boolean
}

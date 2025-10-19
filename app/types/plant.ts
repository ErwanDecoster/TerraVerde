// Types for Plant management

export interface PlantData {
  id: string
  name: string
  description: string
  category: PlantCategory
  status: PlantStatus
  planted_date: string
  main_color: string
  height: number
  width: number
  x_position?: number // Position in meters on the garden map
  y_position?: number // Position in meters on the garden map
  garden_id?: string // Which garden this plant belongs to
  created_at: string
  updated_at: string
}

export type PlantCategory = 'arbre' | 'arbre_fruitier' | 'arbuste' | 'fleur' | 'legume' | 'herbe' | 'autre'

export type PlantStatus = 'healthy' | 'sick' | 'dead' | 'planted'

// Form data types
export interface PlantFormData {
  name: string
  description: string
  category: PlantCategory
  status: PlantStatus
  planted_date: string
  main_color: string
  height: number
  width: number
  x_position?: number
  y_position?: number
  garden_id?: string
}

// Update form data types (all fields editable)
export interface PlantUpdateFormData {
  name: string
  description: string
  category: PlantCategory
  status: PlantStatus
  planted_date: string
  main_color: string
  height: number
  width: number
  x_position?: number
  y_position?: number
  garden_id?: string
}

// Options for selects
export const PLANT_CATEGORIES = [
  { value: 'arbre', label: 'Arbre' },
  { value: 'arbre_fruitier', label: 'Arbre fruitier' },
  { value: 'arbuste', label: 'Arbuste' },
  { value: 'fleur', label: 'Fleur' },
  { value: 'legume', label: 'Légume' },
  { value: 'herbe', label: 'Herbe' },
  { value: 'autre', label: 'Autre' },
] as const

export const PLANT_STATUSES = [
  { value: 'healthy', label: 'En bonne santé', color: 'success' },
  { value: 'sick', label: 'Malade', color: 'warning' },
  { value: 'dead', label: 'Mort', color: 'error' },
  { value: 'planted', label: 'Planté', color: 'info' },
] as const

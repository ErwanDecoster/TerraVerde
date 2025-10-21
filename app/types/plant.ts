// Types for Plant management

import type { VarietyData } from './variety'

export interface PlantData {
  id: string
  name: string
  description: string
  variety_id: number
  variety: VarietyData
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

export type PlantStatus = 'healthy' | 'sick' | 'dead' | 'planted'

// Form data types
export interface PlantFormData {
  name: string
  description: string
  variety_id: number
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
  variety_id: number
  status: PlantStatus
  planted_date: string
  main_color: string
  height: number
  width: number
  x_position?: number
  y_position?: number
  garden_id?: string
}

export const PLANT_STATUSES = [
  { value: 'healthy', label: 'En bonne santé', color: 'success' },
  { value: 'sick', label: 'Malade', color: 'warning' },
  { value: 'dead', label: 'Mort', color: 'error' },
  { value: 'planted', label: 'Planté', color: 'info' },
] as const

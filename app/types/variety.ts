export type PlantCategory = 'arbre' | 'arbre_fruitier' | 'arbuste' | 'fleur' | 'legume' | 'herbe' | 'autre'

export interface VarietyData {
  id: string
  name: string
  scientific_name?: string | null
  harvest_period?: string | null
  main_color?: string | null
  reference_url?: string | null
  category: PlantCategory
  created_at: string
}

export interface VarietyFormData {
  name: string
  scientific_name?: string
  harvest_period?: string
  main_color?: string
  reference_url?: string
  category: PlantCategory
}

// Options for selects
export const VARIETY_CATEGORIES = [
  { value: 'arbre', label: 'Arbre' },
  { value: 'arbre_fruitier', label: 'Arbre fruitier' },
  { value: 'arbuste', label: 'Arbuste' },
  { value: 'fleur', label: 'Fleur' },
  { value: 'legume', label: 'Légume' },
  { value: 'herbe', label: 'Herbe' },
  { value: 'autre', label: 'Autre' },
] as const

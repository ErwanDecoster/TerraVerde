import type { PlantCategory } from '~/types/variety'

export const PLANT_CATEGORIES = [
  { key: 'A', label: 'Tree', value: 'tree' as PlantCategory },
  { key: 'F', label: 'Fruit Tree', value: 'fruit_tree' as PlantCategory },
  { key: 'B', label: 'Shrub', value: 'shrub' as PlantCategory },
  { key: 'L', label: 'Flower', value: 'flower' as PlantCategory },
  { key: 'C', label: 'Climber', value: 'climber' as PlantCategory },
  { key: 'G', label: 'Vegetable', value: 'vegetable' as PlantCategory },
  { key: 'H', label: 'Grass', value: 'grass' as PlantCategory },
  { key: 'W', label: 'Aquatic', value: 'aquatic' as PlantCategory },
  { key: 'X', label: 'Other', value: 'other' as PlantCategory },
] as const

export const plantCategories = PLANT_CATEGORIES
export const getCategoryInfo = (categoryValue: string) => {
  return PLANT_CATEGORIES.find(cat => cat.value === categoryValue)
}

export const getCategoryLabel = (categoryValue: string) => {
  return getCategoryInfo(categoryValue)?.label || categoryValue
}

export const getCategoryKey = (categoryValue: string) => {
  return getCategoryInfo(categoryValue)?.key || 'X'
}

export const getCategoryColor = (categoryValue: string) => {
  const categoryColors = {
    tree: 'success',
    fruit_tree: 'warning',
    shrub: 'info',
    flower: 'secondary',
    climber: 'info',
    vegetable: 'primary',
    grass: 'success',
    aquatic: 'info',
    other: 'neutral',
  } as const
  return categoryColors[categoryValue as keyof typeof categoryColors] || 'neutral'
}

export const VARIETY_CATEGORIES_FOR_SELECT = PLANT_CATEGORIES.map(cat => ({
  value: cat.value,
  label: cat.label,
}))

export type PlantCategoryInfo = typeof PLANT_CATEGORIES[number]

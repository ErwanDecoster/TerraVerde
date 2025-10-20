// Plant categories data
export const plantCategories = [
  { key: 'A', label: 'Arbre', value: 'arbre' },
  { key: 'F', label: 'Arbre fruitier', value: 'arbre_fruitier' },
  { key: 'B', label: 'Arbuste', value: 'arbuste' },
  { key: 'L', label: 'Fleur', value: 'fleur' },
  { key: 'G', label: 'Légume', value: 'legume' },
  { key: 'H', label: 'Herbe', value: 'herbe' },
  { key: 'X', label: 'Autre', value: 'autre' },
]

// Helper function to get category info
export const getCategoryInfo = (categoryValue: string) => {
  return plantCategories.find(cat => cat.value === categoryValue)
}

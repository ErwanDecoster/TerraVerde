import { computed } from 'vue'
import type { PlantData } from '~/types/plant'
import { getPlantDisplaySize, metersToPixels } from '~/utils/coordinates'

export const usePlantMarkers = (
  plants: Ref<PlantData[]>,
  visibleCategories: Ref<string[]>,
  garden: Ref<any>,
) => {
  // Helper function to get stroke color based on plant status
  const getPlantStatusStroke = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#22c55e' // green
      case 'sick':
        return '#f59e0b' // amber
      case 'dead':
        return '#ef4444' // red
      case 'planted':
        return '#3b82f6' // blue
      default:
        return '#6b7280' // gray
    }
  }

  // Helper function to get category letter based on plant category
  const getCategoryLetter = (category: string) => {
    const categoryMap: Record<string, string> = {
      arbre: 'A',
      arbre_fruitier: 'F',
      arbuste: 'B',
      fleur: 'L',
      legume: 'G',
      herbe: 'H',
      autre: 'X',
    }
    return categoryMap[category] || 'X'
  }

  // Plant markers computed from plants data
  const plantMarkers = computed(() => {
    if (!garden.value) return []

    const PixelsPerMeters = garden.value.pixels_per_meters || 20 // Default to 20 pixels per meter

    return plants.value
      .filter(plant => visibleCategories.value.includes(plant.category))
      .map((plant) => {
        // Convert plant position from meters to pixels using the garden's scale
        const pixelX = plant.x_position
          ? metersToPixels(plant.x_position, PixelsPerMeters)
          : 100
        const pixelY = plant.y_position
          ? metersToPixels(plant.y_position, PixelsPerMeters)
          : 100

        // Get the display size in pixels based on the plant's real dimensions
        const displaySize = getPlantDisplaySize(plant, PixelsPerMeters)

        // Use the smaller dimension for radius, with min/max limits
        const radius = displaySize.width

        return {
          id: plant.id,
          plant: plant, // Keep reference to the plant data
          name: `plant-${plant.id}`,
          config: {
            x: pixelX,
            y: pixelY,
            radius: radius,
            fill: plant.main_color || '#ffffff',
            stroke: getPlantStatusStroke(plant.status),
            strokeWidth: 3,
            // Add hover effects
            opacity: plant.status === 'dead' ? 0.6 : 1,
          },
        }
      })
  })

  return {
    plantMarkers,
    getCategoryLetter,
    getPlantStatusStroke,
  }
}

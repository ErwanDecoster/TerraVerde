import { computed, type Ref } from 'vue'
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'
import { metersToPixels } from '~/utils/coordinates'

export const usePlantMarkers = (
  plants: Ref<PlantData[]>,
  visibleCategories: Ref<string[]>,
  garden: Ref<GardenData>,
) => {
  // Helper function to get stroke color based on plant status
  const getPlantStatusStroke = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#00000000'
      case 'sick':
        return '#f59e0b' // amber
      case 'dead':
        return '#ef4444' // red
      case 'planted':
        return '#00000000'
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
      .filter(plant => visibleCategories.value.includes(plant.variety.category))
      .map((plant) => {
        // Convert plant position from meters to pixels using the garden's scale
        const pixelX = plant.x_position
        const pixelY = plant.y_position

        const minVisibleWidth = plant.width > 0.7 ? plant.width : 0.7

        const pixelWidth = metersToPixels(minVisibleWidth, PixelsPerMeters)
        const radius = Math.round(pixelWidth / 2)

        return {
          id: plant.id,
          plant: plant, // Keep reference to the plant data
          name: `plant-${plant.id}`,
          config: {
            x: pixelX,
            y: pixelY,
            radius: radius,
            fill: plant.variety.main_color || '#ffffff',
            stroke: getPlantStatusStroke(plant.status),
            strokeWidth: 1,
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

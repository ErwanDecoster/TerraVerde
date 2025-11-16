import { computed, type Ref } from 'vue'
import { useSettings } from '~/composables/data/useSettings'
import type { SettingsData } from '~/types/settings'
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'
import { metersToPixels } from '~/utils/coordinates'
import { getCategoryKey } from '~/utils/plantCategories'

export const usePlantMarkers = (
  isOwner: Ref<boolean>,
  plants: Ref<PlantData[]>,
  visibleCategories: Ref<string[]>,
  garden: Ref<GardenData>,
) => {
  const { fetchMySettings } = useSettings()
  const userSettings = ref<SettingsData | null>(null)
  fetchMySettings().then((s) => { userSettings.value = s }).catch(() => {})
  const getPlantStatusStroke = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#00000000'
      case 'sick':
        return '#f59e0b'
      case 'dead':
        return '#ef4444'
      case 'planted':
        return '#00000000'
      default:
        return '#6b7280'
    }
  }

  const getCategoryLetter = (category: string) => {
    return getCategoryKey(category)
  }

  const plantMarkers = computed(() => {
    if (!garden.value) return []

    const PixelsPerMeters = garden.value.pixels_per_meters
    const userPref = userSettings.value?.show_markers_letters
    const showMarkersLetters = userPref === undefined || userPref === null ? false : userPref

    return plants.value
      .filter(plant => visibleCategories.value.includes(plant.variety.category))
      .map((plant) => {
        const pixelX = plant.x_position
        const pixelY = plant.y_position

        const minVisibleWidth = plant.width > 0.7 ? plant.width : 0.7

        const pixelWidth = metersToPixels(minVisibleWidth, PixelsPerMeters)
        const radius = Math.round(pixelWidth / 2)

        return {
          id: plant.id,
          plant: plant,
          name: `plant-${plant.id}`,
          showLetter: showMarkersLetters,
          config: {
            x: pixelX,
            y: pixelY,
            radius: radius,
            fill: plant.variety.main_color || '#ffffff',
            stroke: getPlantStatusStroke(plant.status),
            strokeWidth: 1,
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

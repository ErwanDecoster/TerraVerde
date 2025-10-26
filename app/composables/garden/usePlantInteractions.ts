import { ref } from 'vue'
import type { PlantMarker } from '~/components/garden/GardenCanvas.vue'
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'

export const usePlantInteractions = (
  garden: Ref<GardenData>,
  gardenId: string,
  updatePlant: (id: string, data: PlantData) => Promise<PlantData>,
  onPlantClick?: (plant: PlantData) => void,
  isEditingEnabled?: Ref<boolean>,
  onPlantPositionUpdated?: (updatedPlant: PlantData) => void,
) => {
  const hoveredPlant = ref<PlantData | null>(null)

  const handlePlantClick = (marker: PlantMarker) => {
    if (onPlantClick) {
      onPlantClick(marker.plant)
    }
  }

  const handlePlantDragStart = () => {
    if (isEditingEnabled?.value === false) return
  }

  const handlePlantDragEnd = async (marker: PlantMarker, event: Event) => {
    if (isEditingEnabled?.value === false) return

    if (!garden.value) return
    if (!event.target) return

    try {
      const newX = event.target.x()
      const newY = event.target.y()

      const updatedPlant = await updatePlant(marker.plant.id, {
        ...marker.plant,
        x_position: newX,
        y_position: newY,
        garden_id: gardenId,
      })

      if (onPlantPositionUpdated) {
        onPlantPositionUpdated(updatedPlant)
      }
    }
    catch (error) {
      console.error('Failed to update plant position:', error)
    }
  }

  const handlePlantHover = (marker: PlantMarker, isHovering: boolean) => {
    if (isHovering) {
      hoveredPlant.value = marker.plant
    }
    else {
      hoveredPlant.value = null
    }
  }

  return {
    hoveredPlant,
    handlePlantClick,
    handlePlantDragStart,
    handlePlantDragEnd,
    handlePlantHover,
  }
}

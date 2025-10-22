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
  // Plant hover state for tooltips
  const hoveredPlant = ref<PlantData | null>(null)

  // Plant marker event handlers
  const handlePlantClick = (marker: PlantMarker) => {
    console.log(`Plant ${marker.plant.name} clicked!`, marker.plant)
    if (onPlantClick) {
      onPlantClick(marker.plant)
    }
  }

  const handlePlantDragStart = (marker: PlantMarker) => {
    // Only allow drag if editing is enabled
    if (isEditingEnabled?.value === false) return

    console.log(`Plant ${marker.plant.name} drag started`)
  }

  const handlePlantDragEnd = async (marker: PlantMarker, event: Event) => {
    // Only handle drag end if editing is enabled
    if (isEditingEnabled?.value === false) return

    console.log(`Plant ${marker.plant.name} drag ended`)

    if (!garden.value) return
    if (!event.target) return

    try {
      // Get the new position from the event target (the group)
      const newX = event.target.x()
      const newY = event.target.y()

      // Update the plant position in the database
      const updatedPlant = await updatePlant(marker.plant.id, {
        ...marker.plant,
        x_position: newX,
        y_position: newY,
        garden_id: gardenId,
      })

      // Call the callback to update the plant in the parent component
      if (onPlantPositionUpdated) {
        onPlantPositionUpdated(updatedPlant)
      }

      console.log(
        `Plant position updated: (${newX.toFixed(2)}px, ${newY.toFixed(2)}px)`,
      )
    }
    catch (error) {
      console.error('Failed to update plant position:', error)
      // You might want to show a toast notification here
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

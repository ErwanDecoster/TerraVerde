import { ref } from 'vue'
import type { PlantData } from '~/types/plant'
import { pixelsToMeters } from '~/utils/coordinates'

export const usePlantInteractions = (
  garden: Ref<any>,
  gardenId: string,
  updatePlant: Function,
) => {
  // Plant hover state for tooltips
  const hoveredPlant = ref<PlantData | null>(null)

  // Plant marker event handlers
  const handlePlantClick = (marker: any) => {
    console.log(`Plant ${marker.plant.name} clicked!`, marker.plant)
    // You could open a plant details modal here
    // showPlantDetails(marker.plant)
  }

  const handlePlantDragStart = (marker: any) => {
    console.log(`Plant ${marker.plant.name} drag started`)
  }

  const handlePlantDragEnd = async (marker: any, event: any) => {
    console.log(`Plant ${marker.plant.name} drag ended`)

    if (!garden.value) return

    try {
      const PixelsPerMeters = garden.value.pixels_per_meters || 20

      // Get the new position from the event target (the group)
      const newX = event.target.x()
      const newY = event.target.y()

      // Convert pixel position back to meters
      const meterX = pixelsToMeters(newX, PixelsPerMeters)
      const meterY = pixelsToMeters(newY, PixelsPerMeters)

      // Update the plant position in the database
      await updatePlant(marker.plant.id, {
        ...marker.plant,
        x_position: meterX,
        y_position: meterY,
        garden_id: gardenId,
      })

      console.log(
        `Plant position updated: (${meterX.toFixed(2)}m, ${meterY.toFixed(2)}m)`,
      )
    }
    catch (error) {
      console.error('Failed to update plant position:', error)
      // You might want to show a toast notification here
    }
  }

  const handlePlantHover = (marker: any, isHovering: boolean) => {
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

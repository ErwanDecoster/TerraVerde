import type { VarietyData } from '~/types/variety'
import type { PlantData } from '~/types/plant'

/**
 * Composable to sync variety data across plants when varieties are updated
 */
export const useVarietySync = () => {
  /**
   * Updates variety data in all plants that use this variety
   */
  const syncVarietyInPlants = (plants: Ref<PlantData[]>, updatedVariety: VarietyData) => {
    const plantsToUpdate = plants.value.filter(plant =>
      plant.variety_id.toString() === updatedVariety.id.toString(),
    )

    plantsToUpdate.forEach((plant) => {
      plant.variety = { ...updatedVariety }
    })

    plants.value = [...plants.value]
  }

  /**
   * Removes plants that use a deleted variety
   */
  const removeVarietyFromPlants = (plants: Ref<PlantData[]>, deletedVarietyId: string) => {
    const remainingPlants = plants.value.filter(plant =>
      plant.variety_id.toString() !== deletedVarietyId.toString(),
    )

    plants.value = remainingPlants
  }

  const addVarietyToList = (varieties: Ref<VarietyData[]>, newVariety: VarietyData) => {
    varieties.value.unshift(newVariety)
  }

  const syncVarietyInList = (varieties: Ref<VarietyData[]>, updatedVariety: VarietyData) => {
    const index = varieties.value.findIndex(v => v.id.toString() === updatedVariety.id.toString())
    if (index !== -1) {
      varieties.value[index] = { ...updatedVariety }
    }
  }

  const removeVarietyFromList = (varieties: Ref<VarietyData[]>, deletedVarietyId: string) => {
    varieties.value = varieties.value.filter(v => v.id.toString() !== deletedVarietyId.toString())
  }

  return {
    syncVarietyInPlants,
    removeVarietyFromPlants,
    addVarietyToList,
    syncVarietyInList,
    removeVarietyFromList,
  }
}

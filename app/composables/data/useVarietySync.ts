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

    console.log(`Synchronizing variety "${updatedVariety.name}" in ${plantsToUpdate.length} plants`)

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

    console.log(`Removed plants with deleted variety ID: ${deletedVarietyId}`)
    plants.value = remainingPlants
  }

  const addVarietyToList = (varieties: Ref<VarietyData[]>, newVariety: VarietyData) => {
    varieties.value.unshift(newVariety)
    console.log(`Added new variety "${newVariety.name}" to list`)
  }

  const syncVarietyInList = (varieties: Ref<VarietyData[]>, updatedVariety: VarietyData) => {
    const index = varieties.value.findIndex(v => v.id.toString() === updatedVariety.id.toString())
    if (index !== -1) {
      varieties.value[index] = { ...updatedVariety }
      console.log(`Updated variety "${updatedVariety.name}" in varieties list`)
    }
  }

  const removeVarietyFromList = (varieties: Ref<VarietyData[]>, deletedVarietyId: string) => {
    varieties.value = varieties.value.filter(v => v.id.toString() !== deletedVarietyId.toString())
    console.log(`Removed variety with ID ${deletedVarietyId} from list`)
  }

  return {
    syncVarietyInPlants,
    removeVarietyFromPlants,
    addVarietyToList,
    syncVarietyInList,
    removeVarietyFromList,
  }
}

import { usePlant } from "~/composables/data/usePlant";
import type {
  PlantBulkHistoryFormData,
  PlantBulkUpdateFormData,
  PlantData,
  PlantEventData,
  PlantFormData,
  PlantUpdateFormData,
} from "~/types/plant";
import type { VarietyData } from "~/types/variety";

export const usePlantsStore = defineStore("plants", () => {
  const {
    fetchPlants,
    addPlant,
    addMultiplePlants,
    updatePlant,
    deletePlant,
    updatePlantsBulk,
    addPlantEventsBulk,
  } = usePlant();

  const currentGardenId = ref<string | null>(null);
  const plants = ref<PlantData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const reset = () => {
    currentGardenId.value = null;
    plants.value = [];
    loading.value = false;
    error.value = null;
  };

  const loadGardenPlants = async (
    gardenId: string,
    options?: { force?: boolean },
  ) => {
    if (
      !options?.force &&
      currentGardenId.value === gardenId &&
      plants.value.length
    ) {
      return plants.value;
    }

    loading.value = true;
    error.value = null;

    try {
      const nextPlants = await fetchPlants(gardenId);
      currentGardenId.value = gardenId;
      plants.value = nextPlants;
      return nextPlants;
    } catch (nextError) {
      error.value =
        nextError instanceof Error
          ? nextError.message
          : "Failed to load plants";
      throw nextError;
    } finally {
      loading.value = false;
    }
  };

  const setPlants = (gardenId: string, nextPlants: PlantData[]) => {
    currentGardenId.value = gardenId;
    plants.value = nextPlants;
  };

  const prependPlant = (plant: PlantData) => {
    plants.value = [plant, ...plants.value];
  };

  const appendPlant = (plant: PlantData) => {
    plants.value = [...plants.value, plant];
  };

  const upsertPlant = (plant: PlantData) => {
    const index = plants.value.findIndex((current) => current.id === plant.id);

    if (index === -1) {
      prependPlant(plant);
      return;
    }

    const nextPlants = [...plants.value];
    nextPlants[index] = plant;
    plants.value = nextPlants;
  };

  const mergePlants = (nextPlants: PlantData[]) => {
    const plantsById = new Map(plants.value.map((plant) => [plant.id, plant]));

    for (const plant of nextPlants) {
      plantsById.set(plant.id, plant);
    }

    plants.value = plants.value.map(
      (plant) => plantsById.get(plant.id) || plant,
    );
  };

  const removePlant = (plantId: string) => {
    plants.value = plants.value.filter((plant) => plant.id !== plantId);
  };

  const syncVarietyInPlants = (updatedVariety: VarietyData) => {
    plants.value = plants.value.map((plant) =>
      plant.variety_id.toString() === updatedVariety.id.toString()
        ? { ...plant, variety: { ...updatedVariety } }
        : plant,
    );
  };

  const removePlantsByVariety = (deletedVarietyId: string) => {
    plants.value = plants.value.filter(
      (plant) => plant.variety_id.toString() !== deletedVarietyId.toString(),
    );
  };

  const createPlant = async (formData: PlantFormData) => {
    const plant = await addPlant(formData);
    upsertPlant(plant);
    return plant;
  };

  const createMultiplePlants = async (plantsData: PlantFormData[]) => {
    const createdPlants = await addMultiplePlants(plantsData);
    plants.value = [...createdPlants, ...plants.value];
    return createdPlants;
  };

  const updateExistingPlant = async (
    plantId: string,
    formData: PlantUpdateFormData,
  ) => {
    const updatedPlant = await updatePlant(plantId, formData);
    upsertPlant(updatedPlant);
    return updatedPlant;
  };

  const deleteExistingPlant = async (plantId: string) => {
    await deletePlant(plantId);
    removePlant(plantId);
  };

  const updatePlantsInBulk = async (
    plantIds: string[],
    patch: PlantBulkUpdateFormData,
  ) => {
    const updatedPlants = await updatePlantsBulk(plantIds, patch);
    mergePlants(updatedPlants);
    return updatedPlants;
  };

  const addHistoryToPlantsInBulk = async (
    plantIds: string[],
    gardenId: string,
    payload: PlantBulkHistoryFormData,
  ): Promise<PlantEventData[]> => {
    return addPlantEventsBulk(plantIds, gardenId, payload);
  };

  return {
    currentGardenId,
    plants,
    loading,
    error,
    loadGardenPlants,
    setPlants,
    prependPlant,
    appendPlant,
    upsertPlant,
    mergePlants,
    removePlant,
    syncVarietyInPlants,
    removePlantsByVariety,
    createPlant,
    createMultiplePlants,
    updateExistingPlant,
    deleteExistingPlant,
    updatePlantsInBulk,
    addHistoryToPlantsInBulk,
    reset,
  };
});

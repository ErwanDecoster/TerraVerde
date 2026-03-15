import { useGarden } from "~/composables/data/useGarden";
import type {
  GardenData,
  GardenFormData,
  GardenUpdateFormData,
} from "~/types/garden";

export const useGardenStore = defineStore("garden", () => {
  const { addGarden, updateGarden, deleteGarden, fetchGardenById } =
    useGarden();

  const currentGarden = ref<GardenData | null>(null);
  const currentGardenId = ref<string | null>(null);
  const loadingCurrentGarden = ref(false);
  const currentGardenError = ref<string | null>(null);

  const resetCurrentGarden = () => {
    currentGarden.value = null;
    currentGardenId.value = null;
    loadingCurrentGarden.value = false;
    currentGardenError.value = null;
  };

  const loadCurrentGarden = async (
    gardenId: string,
    options?: { force?: boolean },
  ) => {
    if (
      !options?.force &&
      currentGardenId.value === gardenId &&
      currentGarden.value
    ) {
      return currentGarden.value;
    }

    loadingCurrentGarden.value = true;
    currentGardenError.value = null;

    try {
      const garden = await fetchGardenById(gardenId);
      currentGarden.value = garden;
      currentGardenId.value = gardenId;

      if (!garden) {
        currentGardenError.value = "Garden not found";
      }

      return garden;
    } catch (error) {
      currentGardenError.value =
        error instanceof Error ? error.message : "Failed to load garden";
      throw error;
    } finally {
      loadingCurrentGarden.value = false;
    }
  };

  const addNewGarden = async (formData: GardenFormData) => {
    return addGarden(formData);
  };

  const updateCurrentGarden = async (
    gardenId: string,
    formData: GardenUpdateFormData,
    currentImagePath?: string,
    previousPixelsPerMeters?: number,
  ) => {
    const updatedGarden = await updateGarden(
      gardenId,
      formData,
      currentImagePath,
      previousPixelsPerMeters,
    );

    if (currentGardenId.value === gardenId) {
      currentGarden.value = updatedGarden;
    }

    return updatedGarden;
  };

  const removeGarden = async (gardenId: string, imagePath?: string) => {
    await deleteGarden(gardenId, imagePath);

    if (currentGardenId.value === gardenId) {
      resetCurrentGarden();
    }
  };

  return {
    currentGarden,
    currentGardenId,
    loadingCurrentGarden,
    currentGardenError,
    loadCurrentGarden,
    addNewGarden,
    updateCurrentGarden,
    removeGarden,
    resetCurrentGarden,
  };
});

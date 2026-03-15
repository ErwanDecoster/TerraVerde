import { defineStore } from "pinia";
import { useVariety } from "~/composables/data/useVariety";
import type { VarietyFilterMode } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import type { VarietyData, VarietyFormData } from "~/types/variety";

const getAvailableVarietiesKey = (
  gardenId?: string,
  filterMode: VarietyFilterMode = "garden",
) => {
  return `${gardenId || "public-only"}:${filterMode}`;
};

const getUsedVarietiesFromPlants = (plants: PlantData[]) => {
  const byId = new Map<string, VarietyData>();

  for (const plant of plants) {
    if (!plant.variety) {
      continue;
    }

    byId.set(String(plant.variety.id), plant.variety);
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const useVarietiesStore = defineStore("varieties", () => {
  const { fetchVarieties, addVariety, updateVariety, deleteVariety } =
    useVariety();

  const currentGardenId = ref<string | null>(null);
  const currentVarieties = ref<VarietyData[]>([]);
  const currentLoading = ref(false);
  const currentError = ref<string | null>(null);
  const availableVarietiesByKey = ref<Record<string, VarietyData[]>>({});
  const availableLoadingByKey = ref<Record<string, boolean>>({});

  const setAvailableLoading = (key: string, loading: boolean) => {
    availableLoadingByKey.value = {
      ...availableLoadingByKey.value,
      [key]: loading,
    };
  };

  const syncAvailableCaches = (variety: VarietyData) => {
    availableVarietiesByKey.value = Object.fromEntries(
      Object.entries(availableVarietiesByKey.value).map(([key, varieties]) => {
        const index = varieties.findIndex(
          (current) => current.id.toString() === variety.id.toString(),
        );

        if (index === -1) {
          return [key, [variety, ...varieties]];
        }

        const nextVarieties = [...varieties];
        nextVarieties[index] = variety;
        return [key, nextVarieties];
      }),
    );
  };

  const reset = () => {
    currentGardenId.value = null;
    currentVarieties.value = [];
    currentLoading.value = false;
    currentError.value = null;
    availableVarietiesByKey.value = {};
    availableLoadingByKey.value = {};
  };

  const hydrateUsedVarieties = (gardenId: string, plants: PlantData[]) => {
    currentGardenId.value = gardenId;
    currentVarieties.value = getUsedVarietiesFromPlants(plants);
    currentError.value = null;
  };

  const setCurrentVarieties = (gardenId: string, varieties: VarietyData[]) => {
    currentGardenId.value = gardenId;
    currentVarieties.value = varieties;
    currentError.value = null;
  };

  const prependVariety = (variety: VarietyData) => {
    currentVarieties.value = [variety, ...currentVarieties.value];
    syncAvailableCaches(variety);
  };

  const upsertVariety = (variety: VarietyData) => {
    const existingIndex = currentVarieties.value.findIndex(
      (current) => current.id.toString() === variety.id.toString(),
    );

    if (existingIndex === -1) {
      prependVariety(variety);
      return;
    }

    const nextVarieties = [...currentVarieties.value];
    nextVarieties[existingIndex] = variety;
    currentVarieties.value = nextVarieties;
    syncAvailableCaches(variety);
  };

  const removeVariety = (varietyId: string) => {
    currentVarieties.value = currentVarieties.value.filter(
      (variety) => variety.id.toString() !== varietyId.toString(),
    );

    availableVarietiesByKey.value = Object.fromEntries(
      Object.entries(availableVarietiesByKey.value).map(([key, varieties]) => [
        key,
        varieties.filter(
          (variety) => variety.id.toString() !== varietyId.toString(),
        ),
      ]),
    );
  };

  const loadAvailableVarieties = async (
    gardenId?: string,
    filterMode: VarietyFilterMode = "garden",
    options?: { force?: boolean },
  ) => {
    const key = getAvailableVarietiesKey(gardenId, filterMode);

    if (!options?.force && availableVarietiesByKey.value[key]) {
      return availableVarietiesByKey.value[key];
    }

    setAvailableLoading(key, true);

    try {
      const varieties = await fetchVarieties(gardenId, filterMode);
      availableVarietiesByKey.value = {
        ...availableVarietiesByKey.value,
        [key]: varieties,
      };
      return varieties;
    } finally {
      setAvailableLoading(key, false);
    }
  };

  const createVariety = async (varietyData: VarietyFormData) => {
    const variety = await addVariety(varietyData);
    upsertVariety(variety);
    return variety;
  };

  const updateExistingVariety = async (
    varietyId: string,
    varietyData: Partial<VarietyFormData>,
  ) => {
    const updatedVariety = await updateVariety(varietyId, varietyData);
    upsertVariety(updatedVariety);
    return updatedVariety;
  };

  const deleteExistingVariety = async (varietyId: string) => {
    await deleteVariety(varietyId);
    removeVariety(varietyId);
  };

  const getAvailableVarieties = (
    gardenId?: string,
    filterMode: VarietyFilterMode = "garden",
  ) => {
    return (
      availableVarietiesByKey.value[
        getAvailableVarietiesKey(gardenId, filterMode)
      ] || []
    );
  };

  return {
    currentGardenId,
    currentVarieties,
    currentLoading,
    currentError,
    availableVarietiesByKey,
    availableLoadingByKey,
    hydrateUsedVarieties,
    setCurrentVarieties,
    prependVariety,
    upsertVariety,
    removeVariety,
    loadAvailableVarieties,
    createVariety,
    updateExistingVariety,
    deleteExistingVariety,
    getAvailableVarieties,
    reset,
  };
});

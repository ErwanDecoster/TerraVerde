import { defineStore } from "pinia";
import { useGarden } from "~/composables/data/useGarden";
import type { GardenData } from "~/types/garden";

export const useGardensStore = defineStore("gardens", () => {
  const { fetchMyGardens, fetchPublicGardens } = useGarden();

  const myGardens = ref<GardenData[]>([]);
  const publicGardens = ref<GardenData[]>([]);
  const loadingMyGardens = ref(false);
  const loadingPublicGardens = ref(false);
  const myGardensLoaded = ref(false);
  const publicGardensLoaded = ref(false);
  const myGardensError = ref<string | null>(null);
  const publicGardensError = ref<string | null>(null);

  const loadMyGardens = async (options?: { force?: boolean }) => {
    if (!options?.force && myGardensLoaded.value) {
      return myGardens.value;
    }

    loadingMyGardens.value = true;
    myGardensError.value = null;

    try {
      const gardens = await fetchMyGardens();
      myGardens.value = gardens;
      myGardensLoaded.value = true;
      return gardens;
    } catch (error) {
      myGardensError.value =
        error instanceof Error ? error.message : "Failed to load gardens";
      throw error;
    } finally {
      loadingMyGardens.value = false;
    }
  };

  const loadPublicGardens = async (options?: { force?: boolean }) => {
    if (!options?.force && publicGardensLoaded.value) {
      return publicGardens.value;
    }

    loadingPublicGardens.value = true;
    publicGardensError.value = null;

    try {
      const gardens = await fetchPublicGardens();
      publicGardens.value = gardens;
      publicGardensLoaded.value = true;
      return gardens;
    } catch (error) {
      publicGardensError.value =
        error instanceof Error
          ? error.message
          : "Failed to load public gardens";
      throw error;
    } finally {
      loadingPublicGardens.value = false;
    }
  };

  const upsertMyGarden = (garden: GardenData) => {
    myGardens.value = upsertGarden(myGardens.value, garden);
  };

  const removeMyGarden = (gardenId: string) => {
    myGardens.value = myGardens.value.filter(
      (garden) => garden.id !== gardenId,
    );
  };

  const removePublicGarden = (gardenId: string) => {
    publicGardens.value = publicGardens.value.filter(
      (garden) => garden.id !== gardenId,
    );
  };

  const syncPublicGarden = (garden: GardenData) => {
    publicGardens.value = garden.is_public
      ? upsertGarden(publicGardens.value, garden)
      : publicGardens.value.filter((current) => current.id !== garden.id);
  };

  const reset = () => {
    myGardens.value = [];
    publicGardens.value = [];
    loadingMyGardens.value = false;
    loadingPublicGardens.value = false;
    myGardensLoaded.value = false;
    publicGardensLoaded.value = false;
    myGardensError.value = null;
    publicGardensError.value = null;
  };

  return {
    myGardens,
    publicGardens,
    loadingMyGardens,
    loadingPublicGardens,
    myGardensLoaded,
    publicGardensLoaded,
    myGardensError,
    publicGardensError,
    loadMyGardens,
    loadPublicGardens,
    upsertMyGarden,
    removeMyGarden,
    removePublicGarden,
    syncPublicGarden,
    reset,
  };
});

const upsertGarden = (gardens: GardenData[], garden: GardenData) => {
  const existingIndex = gardens.findIndex(
    (current) => current.id === garden.id,
  );

  if (existingIndex === -1) {
    return [garden, ...gardens];
  }

  const nextGardens = [...gardens];
  nextGardens[existingIndex] = garden;
  return nextGardens;
};

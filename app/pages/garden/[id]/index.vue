<template>
  <div v-if="pending" class="flex h-screen items-center justify-center">
    <UIcon
      name="i-heroicons-arrow-path-20-solid"
      class="animate-spin text-4xl"
    />
    <span class="ml-2">Loading garden...</span>
  </div>

  <div v-else-if="error" class="flex h-screen items-center justify-center">
    <UAlert
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Error"
      :description="error"
    />
  </div>

  <div v-else-if="!garden" class="flex h-screen items-center justify-center">
    <UAlert
      icon="i-heroicons-information-circle-20-solid"
      color="warning"
      variant="subtle"
      title="Garden not found"
      description="The requested garden could not be found."
    />
  </div>

  <div v-else class="overflow-hidden">
    <div class="relative flex-1 overflow-hidden">
      <GardenHeader
        :garden="garden"
        :plants="plants"
        :is-editing-enabled="isEditingEnabled"
        :current-role="currentRole"
        @garden-updated="loadGarden"
        @background-rotation-preview="handleBackgroundRotationPreview"
        @background-offset-preview="handleBackgroundOffsetPreview"
        @pixels-per-meters-preview="handlePixelsPerMetersPreview"
        @default-zoom-preview="handleDefaultZoomPreview"
        @default-center-preview="handleDefaultCenterPreview"
        @update:editing-enabled="isEditingEnabled = $event"
      />

      <GardenZoomControls
        :stage-config="stageConfig"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset-zoom="onCenterZoom"
      />

      <PlantCategoryFilters v-model:visible-categories="visibleCategories" />

      <PlantHoverData v-if="hoveredPlant" :plant="hoveredPlant" />

      <GardenCanvas
        ref="canvas"
        :stage-config="stageConfig"
        :background="background"
        :background-config="backgroundConfig"
        :plant-markers="plantMarkers"
        :selected-plant-ids="selectedPlantIds"
        :is-editing-enabled="canEdit"
        :handle-wheel="handleWheel"
        :handle-plant-click="handlePlantClick"
        :handle-plant-drag-start="handlePlantDragStart"
        :handle-plant-drag-end="handlePlantDragEnd"
        :handle-plant-hover-enter="handlePlantHoverEnter"
        :handle-plant-hover-leave="handlePlantHoverLeave"
        :get-category-letter="getCategoryLetter"
        :handle-background-click="handleBackgroundClick"
      />

      <div
        v-if="selectedPlantIds.length"
        class="bg-default/75 border-default absolute top-16 right-2 z-10 flex items-center gap-2 rounded-xl border p-2 backdrop-blur"
      >
        <span class="text-xs font-medium">
          {{ selectedPlantIds.length }} plant(s) selected
        </span>
        <UButton size="xs" variant="ghost" @click="clearSelection">
          Clear
        </UButton>
      </div>
    </div>

    <AddPlantModal
      v-if="showAddPlantModal && permissions.editPlants"
      v-model:open="showAddPlantModal"
      :garden-id="gardenId"
      :variety-filter-mode="garden?.variety_filter_mode"
      :click-coordinates="clickCoordinates"
      @plant-added="onPlantAdded"
      @variety-updated="onVarietyUpdated"
    />

    <PlantInfoModal
      v-if="selectedPlant && showPlantInfoModal"
      v-model:open="showPlantInfoModal"
      :plant="selectedPlant"
      :can-edit="permissions.editPlants"
      :can-manage-history="canManagePlantHistory"
      :can-search-same-variety="true"
      @edit-requested="onEditRequested"
      @search-same-variety-requested="onSearchSameVarietyRequested"
    />

    <EditPlantModal
      v-if="selectedPlant && showEditPlantModal && permissions.editPlants"
      v-model:open="showEditPlantModal"
      :plant="selectedPlant"
      :variety-filter-mode="garden?.variety_filter_mode"
      @plant-updated="onPlantUpdated"
      @plant-deleted="onPlantDeleted"
      @plant-copied="onPlantCopied"
      @locate-requested="onLocateRequestedFromEditModal"
      @variety-updated="onVarietyUpdated"
    />

    <BulkEditPlantsModal
      v-if="showBulkEditModal"
      v-model:open="showBulkEditModal"
      :plants="selectedPlantsForBulk"
      :garden-id="gardenId"
      :variety-filter-mode="garden?.variety_filter_mode"
      :can-bulk-edit="permissions.editPlants"
      :can-bulk-add-history="canManagePlantHistory"
      :mode="bulkMode"
      @bulk-updated="onBulkUpdated"
      @bulk-history-added="onBulkHistoryAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import GardenCanvas, {
  type KonvaNodeEventLike,
} from "~/components/garden/GardenCanvas.vue";
import GardenHeader from "~/components/garden/GardenHeader.vue";
import GardenZoomControls from "~/components/garden/GardenZoomControls.vue";
import PlantCategoryFilters from "~/components/garden/PlantCategoryFilters.vue";
import PlantHoverData from "~/components/garden/PlantHoverData.vue";
import AddPlantModal from "~/components/plant/AddPlantModal.vue";
import BulkEditPlantsModal from "~/components/plant/BulkEditPlantsModal.vue";
import EditPlantModal from "~/components/plant/EditPlantModal.vue";
import PlantInfoModal from "~/components/plant/PlantInfoModal.vue";
import { useBulkPlantSelection } from "~/composables/garden/useBulkPlantSelection";
import { useGardenCanvas } from "~/composables/garden/useGardenCanvas";
import { useGardenZoom } from "~/composables/garden/useGardenZoom";
import { usePlantInteractions } from "~/composables/garden/usePlantInteractions";
import { usePlantMarkers } from "~/composables/garden/usePlantMarkers";
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import type { TeamRole } from "~/types/team";
import type { VarietyData } from "~/types/variety";

const route = useRoute();
const router = useRouter();
const gardenId = route.params.id as string;
const toast = useToast();

const gardenStore = useGardenStore();
const teamsStore = useTeamsStore();
const plantsStore = usePlantsStore();
const varietiesStore = useVarietiesStore();
const { currentGarden: garden } = storeToRefs(gardenStore);
const { plants, currentGardenId: plantsGardenId } = storeToRefs(plantsStore);

const currentRole = computed<TeamRole | null>(
  () =>
    teamsStore.getGardenAccess(gardenId)?.role ??
    (garden.value?.is_public ? "viewer" : null),
);

// Permission matrix
const rolePermissions = {
  owner: {
    manageTeams: true,
    editPlants: true,
    editVarieties: true,
    toggleEdit: true,
    deleteGarden: true,
  },
  admin: {
    manageTeams: true,
    editPlants: true,
    editVarieties: true,
    toggleEdit: true,
    deleteGarden: false,
  },
  editor: {
    manageTeams: false,
    editPlants: true,
    editVarieties: true,
    toggleEdit: true,
    deleteGarden: false,
  },
  viewer: {
    manageTeams: false,
    editPlants: false,
    editVarieties: false,
    toggleEdit: false,
    deleteGarden: false,
  },
} as const;

const permissions = computed(() =>
  currentRole.value
    ? rolePermissions[currentRole.value]
    : rolePermissions.viewer,
);
const isEditingEnabled = ref(false);
const canEdit = computed(
  () => Boolean(isEditingEnabled.value) && permissions.value.editPlants,
);
const canManagePlantHistory = computed(
  () => currentRole.value === "owner" || currentRole.value === "admin",
);

const visibleCategories = ref<string[]>([
  "tree",
  "fruit_tree",
  "shrub",
  "flower",
  "climber",
  "vegetable",
  "grass",
  "aquatic",
  "other",
]);

const pending = ref(true);
const error = ref<string | null>(null);

const showAddPlantModal = ref(false);
const showEditPlantModal = ref(false);
const showPlantInfoModal = ref(false);
const showBulkEditModal = ref(false);
const selectedPlant = ref<PlantData | null>(null);
const bulkMode = ref<"standard" | "edit">("standard");

interface KonvaStage {
  scaleX: () => number;
  scaleY: () => number;
  x: () => number;
  y: () => number;
  width: () => number;
  height: () => number;
  scale: (scale: { x: number; y: number }) => void;
  position: (pos: { x: number; y: number }) => void;
  batchDraw: () => void;
  getPointerPosition: () => { x: number; y: number } | null;
}

const canvas = ref<{ stage: { getStage: () => KonvaStage } } | null>(null);

const {
  stageConfig,
  handleWheel,
  zoomIn,
  zoomOut,
  focusOnPoint,
  resetZoom,
  handleResize,
} = useGardenZoom(
  computed(() => canvas.value?.stage || null),
  computed(() => backgroundConfig),
);

const defaultZoomPreview = ref<number | null>(null);
const defaultCenterPreview = ref<{ x: number | null; y: number | null }>({
  x: null,
  y: null,
});

const getSavedCenterZoomOptions = () => {
  const rawDefaultZoom = garden.value?.default_zoom;
  const rawDefaultCenterX = garden.value?.default_center_x;
  const rawDefaultCenterY = garden.value?.default_center_y;
  const parsedDefaultZoom = Number(rawDefaultZoom);
  const parsedDefaultCenterX = Number(rawDefaultCenterX);
  const parsedDefaultCenterY = Number(rawDefaultCenterY);

  return {
    applyDefaultZoom: true,
    defaultZoom: Number.isFinite(parsedDefaultZoom) ? parsedDefaultZoom : null,
    centerX: Number.isFinite(parsedDefaultCenterX)
      ? parsedDefaultCenterX
      : null,
    centerY: Number.isFinite(parsedDefaultCenterY)
      ? parsedDefaultCenterY
      : null,
  };
};

const applySavedCenterZoom = () => {
  resetZoom(getSavedCenterZoomOptions());
};

const onCenterZoom = () => {
  applySavedCenterZoom();
};

const handleDefaultZoomPreview = (defaultZoomPercent: number | null) => {
  defaultZoomPreview.value = defaultZoomPercent;

  resetZoom({
    applyDefaultZoom: true,
    defaultZoom: defaultZoomPreview.value,
    centerX: defaultCenterPreview.value.x,
    centerY: defaultCenterPreview.value.y,
  });
};

const handleDefaultCenterPreview = (payload: {
  x: number | null;
  y: number | null;
}) => {
  defaultCenterPreview.value = payload;

  resetZoom({
    applyDefaultZoom: true,
    defaultZoom: defaultZoomPreview.value,
    centerX: defaultCenterPreview.value.x,
    centerY: defaultCenterPreview.value.y,
  });
};

const {
  background,
  backgroundConfig,
  loadBackgroundImage,
  setBackgroundRotation,
  setBackgroundOffset,
} = useGardenCanvas(applySavedCenterZoom);

const pixelsPerMetersPreview = ref<number | null>(null);
const gardenState = computed(() => garden.value || ({} as GardenData));

const handleBackgroundRotationPreview = (rotation: number) => {
  setBackgroundRotation(rotation);
};

const handleBackgroundOffsetPreview = (payload: { x: number; y: number }) => {
  setBackgroundOffset(payload.x, payload.y);
};

const handlePixelsPerMetersPreview = (pixelsPerMeters: number) => {
  pixelsPerMetersPreview.value = pixelsPerMeters;
};

const { plantMarkers, getCategoryLetter } = usePlantMarkers(
  plants,
  visibleCategories,
  gardenState,
  pixelsPerMetersPreview,
);

const clickCoordinates = ref<{ x: number; y: number } | null>(null);
const plantsForGarden = computed(() =>
  plantsGardenId.value === gardenId ? plants.value : [],
);
const focusedPlantIdFromQuery = computed(() => {
  const queryPlantId = route.query.focusPlantId;
  return typeof queryPlantId === "string" ? queryPlantId : null;
});

const onPlantClick = (plant: PlantData) => {
  if (isSelectionKeyPressed.value && canUseBulkInCurrentMode.value) {
    toggleSelection(plant.id);
    return;
  }

  selectedPlant.value = plant;

  if (canEdit.value && isEditingEnabled.value) {
    showEditPlantModal.value = true;
  } else {
    showPlantInfoModal.value = true;
  }
};

const selectedPlantsForBulk = computed(() => {
  if (selectedPlantIds.value.length === 0) return [];

  const selectedSet = new Set(selectedPlantIds.value);
  return plantsForGarden.value.filter((plant) => selectedSet.has(plant.id));
});

const canUseBulkInCurrentMode = computed(() => {
  if (isEditingEnabled.value) {
    return permissions.value.editPlants;
  }

  return permissions.value.editPlants || canManagePlantHistory.value;
});

const {
  isSelectionKeyPressed,
  selectedPlantIds,
  toggleSelection,
  clearSelection,
  mount,
  unmount,
} = useBulkPlantSelection(() => {
  if (!canUseBulkInCurrentMode.value) return;
  if (selectedPlantIds.value.length < 2) return;

  bulkMode.value = isEditingEnabled.value ? "edit" : "standard";
  showBulkEditModal.value = true;
});

const onBulkUpdated = (updatedPlants: PlantData[]) => {
  if (!updatedPlants.length) return;
  plantsStore.mergePlants(updatedPlants);
};

const onBulkHistoryAdded = (count: number) => {
  toast.add({
    title: "Bulk History Added",
    description: `${count} history events created`,
    color: "success",
  });
};

watch(
  () => showBulkEditModal.value,
  (isOpen) => {
    if (!isOpen) {
      clearSelection();
    }
  },
);

const handleBackgroundClick = (event: KonvaNodeEventLike) => {
  if (!isEditingEnabled.value || !canEdit.value) return;

  if (!event.target) return;

  const stage = event.target.getStage();
  const clickedElement = event.target;
  const isStageClick = Object.is(clickedElement as unknown, stage as unknown);

  if (isStageClick || clickedElement.attrs?.name === "background") {
    const pointer = stage.getPointerPosition();

    if (pointer) {
      const stageX = stage.x();
      const stageY = stage.y();
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();

      const imageX = (pointer.x - stageX) / scaleX;
      const imageY = (pointer.y - stageY) / scaleY;

      clickCoordinates.value = { x: imageX, y: imageY };
    }
    showAddPlantModal.value = true;
  }
};

const onPlantAdded = (newPlant: PlantData) => {
  plantsStore.appendPlant(newPlant);
  showAddPlantModal.value = false;
  clickCoordinates.value = null;
};

const onPlantUpdated = (updatedPlant: PlantData) => {
  plantsStore.upsertPlant(updatedPlant);
  showEditPlantModal.value = false;
  selectedPlant.value = null;
};

const onPlantPositionUpdated = (updatedPlant: PlantData) => {
  plantsStore.upsertPlant(updatedPlant);
};

const onPlantDeleted = (plantId: string) => {
  plantsStore.removePlant(plantId);
  showEditPlantModal.value = false;
  selectedPlant.value = null;
};

const onPlantCopied = (copiedPlant: PlantData) => {
  plantsStore.appendPlant(copiedPlant);
};

const onLocateRequestedFromEditModal = async (plant: PlantData) => {
  await router.replace({
    query: {
      ...route.query,
      focusPlantId: plant.id,
      focusMode: "quarter",
    },
  });
};

const onEditRequested = (plant: PlantData) => {
  if (!permissions.value.editPlants) return;

  selectedPlant.value = plant;
  showPlantInfoModal.value = false;
  showEditPlantModal.value = true;
};

const onSearchSameVarietyRequested = async (plant: PlantData) => {
  showPlantInfoModal.value = false;

  await navigateTo({
    path: `/garden/${gardenId}/plants`,
    query: {
      search: plant.variety.name,
      varietyId: plant.variety.id,
    },
  });
};

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  plantsStore.syncVarietyInPlants(updatedVariety);
  varietiesStore.upsertVariety(updatedVariety);
};

const clearFocusPlantQuery = async () => {
  if (!focusedPlantIdFromQuery.value) return;

  const {
    focusPlantId: _focusPlantId,
    focusMode: _focusMode,
    ...query
  } = route.query;
  await router.replace({ query });
};

const focusPlantOnMap = (plantId: string) => {
  const marker = plantMarkers.value.find((item) => item.id === plantId);
  if (!marker) return false;

  const objectDiameter = Math.max(marker.config.radius * 2, 1);
  return focusOnPoint({
    x: marker.config.x,
    y: marker.config.y,
    objectDiameter,
    objectScreenRatio: 0.2,
  });
};

const applyFocusPlantFromQuery = async () => {
  const focusedPlantId = focusedPlantIdFromQuery.value;
  if (!focusedPlantId) return;

  let focused = focusPlantOnMap(focusedPlantId);

  if (!focused) {
    for (let retries = 0; retries < 6 && !focused; retries += 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      focused = focusPlantOnMap(focusedPlantId);
    }
  }

  if (!focused) {
    toast.add({
      title: "Plant not found",
      description: "Unable to locate this plant on the garden map.",
      color: "warning",
    });
  }

  await clearFocusPlantQuery();
};

const {
  hoveredPlant,
  handlePlantClick,
  handlePlantDragStart,
  handlePlantDragEnd,
  handlePlantHoverEnter,
  handlePlantHoverLeave,
} = usePlantInteractions(
  gardenState,
  gardenId,
  plantsStore.updateExistingPlant,
  onPlantClick,
  canEdit,
  onPlantPositionUpdated,
);

const toFiniteNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
};

const setGardenCenterPreview = (gardenData: GardenData) => {
  defaultZoomPreview.value = toFiniteNumberOrNull(gardenData.default_zoom);
  defaultCenterPreview.value = {
    x: toFiniteNumberOrNull(gardenData.default_center_x),
    y: toFiniteNumberOrNull(gardenData.default_center_y),
  };
};

const resolveGardenAccess = async (gardenData: GardenData) => {
  const access = await teamsStore.resolveGardenAccess(gardenId, gardenData);
  return access.allowed;
};

const loadGarden = async () => {
  try {
    pending.value = true;
    error.value = null;

    const gardenData = await gardenStore.loadCurrentGarden(gardenId, {
      force: true,
    });

    if (!gardenData) {
      error.value = "Garden not found";
      return;
    }

    const allowed = await resolveGardenAccess(gardenData);
    if (!allowed) {
      error.value = "Access denied. This garden is private.";
      return;
    }

    setGardenCenterPreview(gardenData);
    pixelsPerMetersPreview.value = null;

    if (gardenData.background_image_url) {
      loadBackgroundImage(
        gardenData.background_image_url,
        gardenData.background_image_rotation ?? 0,
        gardenData.background_image_offset_x ?? 0,
        gardenData.background_image_offset_y ?? 0,
      );
    }
    await loadPlants();
  } catch (err) {
    console.error("Error loading garden:", err);
    error.value = "Failed to load garden data";
  } finally {
    pending.value = false;
  }
};

const loadPlants = async () => {
  try {
    const loadedPlants = await plantsStore.loadGardenPlants(gardenId, {
      force: true,
    });
    varietiesStore.hydrateUsedVarieties(gardenId, loadedPlants);

    await nextTick();
    setTimeout(async () => {
      applySavedCenterZoom();
      await applyFocusPlantFromQuery();
    }, 200);
  } catch (err) {
    console.error("Error loading plants:", err);
  }
};

watch(
  focusedPlantIdFromQuery,
  async (plantId) => {
    if (!plantId || pending.value) return;
    await nextTick();
    await applyFocusPlantFromQuery();
  },
  { immediate: false },
);

onMounted(() => {
  loadGarden();
  mount();

  if (globalThis.window !== undefined) {
    globalThis.window.addEventListener("resize", handleResize);
  }
});

onUnmounted(() => {
  unmount();

  if (globalThis.window !== undefined) {
    globalThis.window.removeEventListener("resize", handleResize);
  }
});
</script>

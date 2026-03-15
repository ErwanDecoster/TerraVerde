<template>
  <div>
    <div v-if="pending" class="flex h-screen items-center justify-center">
      <UIcon
        name="i-heroicons-arrow-path-20-solid"
        class="animate-spin text-4xl"
      />
      <span class="ml-2">Loading plants...</span>
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

    <div v-else class="p-4">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              icon="i-heroicons-arrow-left-20-solid"
              @click="navigateTo(`/garden/${gardenId}`)"
            >
              Back to Garden
            </UButton>
          </div>
          <h1 class="mt-2 text-3xl font-bold">
            Plants - {{ garden?.name }}
            <UBadge
              v-if="garden?.is_public && !isOwner"
              color="info"
              variant="subtle"
              class="ml-2"
            >
              Public Garden
            </UBadge>
          </h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">
            {{
              isOwner
                ? "Manage all plants in the garden"
                : "View all plants in this public garden"
            }}
          </p>
        </div>

        <AddPlantModal
          v-if="isOwner"
          :garden-id="gardenId"
          :variety-filter-mode="garden?.variety_filter_mode"
          @plant-added="onPlantAdded"
          @variety-updated="onVarietyUpdated"
        >
          <UButton color="primary" icon="i-heroicons-plus-20-solid">
            Add Plant
          </UButton>
        </AddPlantModal>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-sparkles-20-solid"
              class="h-8 w-8 text-green-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p class="text-2xl font-semibold">
                {{ plants.length }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-smile" class="h-8 w-8 text-emerald-500" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Healthy</p>
              <p class="text-2xl font-semibold">
                {{ healthyCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-annoyed" class="h-8 w-8 text-yellow-500" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Sick</p>
              <p class="text-2xl font-semibold">
                {{ sickCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-squares-2x2-20-solid"
              class="h-8 w-8 text-blue-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Varieties</p>
              <p class="text-2xl font-semibold">
                {{ varietiesCount }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Plants List</h2>
            <div class="flex items-center gap-2">
              <UInput
                v-model="searchQuery"
                icon="i-heroicons-magnifying-glass-20-solid"
                placeholder="Search plants..."
                size="sm"
              />
            </div>
          </div>
        </template>

        <UTable
          :data="filteredPlants"
          :columns="columns"
          :loading="pending"
          class="-m-4 sm:-m-6"
        >
          <template #name-cell="{ row }">
            <div
              class="flex cursor-pointer items-center gap-2"
              @click="openPlantInfoModal(row.original)"
            >
              <div
                class="h-4 w-4 rounded-full border"
                :style="{
                  backgroundColor: row.original.variety.main_color || '#CCCCCC',
                }"
              />
              <span class="font-medium underline-offset-2 hover:underline">
                {{ row.original.name }}
              </span>
            </div>
          </template>

          <template #variety-cell="{ row }">
            <div
              class="cursor-pointer"
              @click="openPlantInfoModal(row.original)"
            >
              <p class="font-medium">
                {{ row.original.variety.name }}
              </p>
              <p
                v-if="row.original.variety.scientific_name"
                class="text-xs text-gray-500 italic"
              >
                {{ row.original.variety.scientific_name }}
              </p>
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              class="cursor-pointer"
              :color="getStatusColor(row.original.status)"
              variant="subtle"
              @click="openPlantInfoModal(row.original)"
            >
              {{ getStatusLabel(row.original.status) }}
            </UBadge>
          </template>

          <template #planted_date-cell="{ row }">
            <span
              class="cursor-pointer"
              @click="openPlantInfoModal(row.original)"
            >
              {{ formatDate(row.original.planted_date) }}
            </span>
          </template>

          <template #dimensions-cell="{ row }">
            <span
              class="cursor-pointer"
              @click="openPlantInfoModal(row.original)"
            >
              {{ row.original.height }}m × {{ row.original.width }}m
            </span>
          </template>

          <template #position-cell="{ row }">
            <span
              class="cursor-pointer text-sm text-gray-500"
              @click="openPlantInfoModal(row.original)"
            >
              ({{ row.original.x_position?.toFixed(1) || 0 }},
              {{ row.original.y_position?.toFixed(1) || 0 }})
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <EditVarietyModal
                :variety="row.original.variety"
                :open="activeVarietyEditorPlantId === row.original.id"
                :hide-trigger="true"
                @update:open="
                  onVarietyEditorOpenChange(row.original.id, $event)
                "
                @variety-updated="onVarietyUpdated"
                @variety-deleted="onVarietyDeleted"
              />

              <EditPlantModal
                v-if="isOwner"
                :plant="row.original"
                :open="activePlantEditorId === row.original.id"
                :hide-trigger="true"
                :variety-filter-mode="garden?.variety_filter_mode"
                @update:open="onPlantEditorOpenChange(row.original.id, $event)"
                @plant-updated="onPlantUpdated"
                @plant-deleted="onPlantDeleted"
                @plant-copied="onPlantAdded"
                @locate-requested="onLocateRequested"
                @variety-updated="onVarietyUpdated"
              />

              <UDropdownMenu :items="getPlantActionItems(row.original)">
                <UButton
                  label="Actions"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                  size="sm"
                  variant="ghost"
                />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal
        v-model:open="showDeletePlantConfirmModal"
        title="Delete Plant"
        description="This action cannot be undone."
      >
        <template #body>
          <p class="text-sm">
            Are you sure you want to delete
            <span class="font-semibold">{{ plantToDelete?.name }}</span
            >?
          </p>
        </template>

        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              variant="ghost"
              :disabled="deletingPlant"
              @click="showDeletePlantConfirmModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-heroicons-trash-20-solid"
              :loading="deletingPlant"
              :disabled="deletingPlant"
              @click="confirmDeletePlant"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>

      <PlantInfoModal
        v-if="selectedPlant && showPlantInfoModal"
        v-model:open="showPlantInfoModal"
        :plant="selectedPlant"
        :can-manage-history="isOwner"
        :show-bulk-tip="false"
        :can-locate="true"
        @locate-requested="onLocateRequested"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import AddPlantModal from "~/components/plant/AddPlantModal.vue";
import EditPlantModal from "~/components/plant/EditPlantModal.vue";
import PlantInfoModal from "~/components/plant/PlantInfoModal.vue";
import EditVarietyModal from "~/components/variety/EditVarietyModal.vue";
import { useIsOwner } from "~/composables/useIsOwner";
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import { PLANT_STATUSES } from "~/types/plant";
import type { VarietyData } from "~/types/variety";

const route = useRoute();
const router = useRouter();
const gardenId = route.params.id as string;
const toast = useToast();

const gardenStore = useGardenStore();
const teamsStore = useTeamsStore();
const plantsStore = usePlantsStore();
const { currentGarden: garden } = storeToRefs(gardenStore);
const { plants, currentGardenId: plantsGardenId } = storeToRefs(plantsStore);
const { isOwner } = useIsOwner(gardenId);

const pending = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedPlant = ref<PlantData | null>(null);
const showPlantInfoModal = ref(false);
const showDeletePlantConfirmModal = ref(false);
const plantToDelete = ref<PlantData | null>(null);
const deletingPlant = ref(false);
const activePlantEditorId = ref<string | null>(null);
const activeVarietyEditorPlantId = ref<string | null>(null);
const plantsForGarden = computed(() =>
  plantsGardenId.value === gardenId ? plants.value : [],
);
const searchFromQuery = computed(() => {
  const value = route.query.search;
  return typeof value === "string" ? value : "";
});
const varietyIdFilterFromQuery = computed(() => {
  const value = route.query.varietyId;
  return typeof value === "string" && value.length ? value : null;
});

const columns = computed(() => {
  const baseColumns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "variety",
      header: "Variety",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "planted_date",
      header: "Planted Date",
    },
    {
      id: "dimensions",
      header: "Dimensions",
    },
    {
      id: "position",
      header: "Position",
    },
    {
      id: "actions",
      header: "Actions",
    },
  ];

  return baseColumns;
});

const filteredPlants = computed(() => {
  const plantsMatchingVariety = varietyIdFilterFromQuery.value
    ? plantsForGarden.value.filter(
        (plant) =>
          plant.variety.id.toString() === varietyIdFilterFromQuery.value,
      )
    : plantsForGarden.value;

  if (!searchQuery.value) return plantsMatchingVariety;

  const query = searchQuery.value.toLowerCase();
  return plantsMatchingVariety.filter(
    (plant) =>
      plant.name.toLowerCase().includes(query) ||
      plant.variety.name.toLowerCase().includes(query) ||
      plant.variety.scientific_name?.toLowerCase().includes(query) ||
      plant.description.toLowerCase().includes(query),
  );
});

const healthyCount = computed(
  () =>
    plantsForGarden.value.filter((plant) => plant.status === "healthy").length,
);

const sickCount = computed(
  () => plantsForGarden.value.filter((plant) => plant.status === "sick").length,
);

const varietiesCount = computed(() => {
  const uniqueVarietyIds = new Set(
    plantsForGarden.value
      .filter((plant) => plant.variety_id)
      .map((plant) => plant.variety_id),
  );
  return uniqueVarietyIds.size;
});

const getStatusColor = (status: string) => {
  const statusConfig = PLANT_STATUSES.find((s) => s.value === status);
  return statusConfig?.color || "neutral";
};

const getStatusLabel = (status: string) => {
  const statusConfig = PLANT_STATUSES.find((s) => s.value === status);
  return statusConfig?.label || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const onPlantAdded = (plant: PlantData) => {
  plantsStore.prependPlant(plant);
};

const onPlantUpdated = (updatedPlant: PlantData) => {
  plantsStore.upsertPlant(updatedPlant);
};

const onPlantDeleted = (plantId: string) => {
  plantsStore.removePlant(plantId);
};

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  plantsStore.syncVarietyInPlants(updatedVariety);
};

const onVarietyDeleted = (varietyId: string) => {
  plantsStore.removePlantsByVariety(varietyId);
};

const openPlantInfoModal = (plant: PlantData) => {
  selectedPlant.value = plant;
  showPlantInfoModal.value = true;
};

const onLocateRequested = async (plant: PlantData) => {
  showPlantInfoModal.value = false;

  await navigateTo({
    path: `/garden/${gardenId}`,
    query: {
      focusPlantId: plant.id,
      focusMode: "quarter",
    },
  });
};

const onSearchSameVariety = async (plant: PlantData) => {
  await router.replace({
    query: {
      ...route.query,
      search: plant.variety.name,
      varietyId: plant.variety.id,
    },
  });
};

const requestDeletePlant = (plant: PlantData) => {
  plantToDelete.value = plant;
  showDeletePlantConfirmModal.value = true;
};

const openPlantEditor = (plant: PlantData) => {
  activePlantEditorId.value = plant.id;
};

const onPlantEditorOpenChange = (plantId: string, isOpen: boolean) => {
  if (!isOpen && activePlantEditorId.value === plantId) {
    activePlantEditorId.value = null;
  }
};

const openVarietyEditorFromPlant = (plant: PlantData) => {
  activeVarietyEditorPlantId.value = plant.id;
};

const onVarietyEditorOpenChange = (plantId: string, isOpen: boolean) => {
  if (!isOpen && activeVarietyEditorPlantId.value === plantId) {
    activeVarietyEditorPlantId.value = null;
  }
};

const confirmDeletePlant = async () => {
  if (!plantToDelete.value) return;

  deletingPlant.value = true;
  try {
    await plantsStore.deleteExistingPlant(plantToDelete.value.id);
    toast.add({
      title: "Plant Deleted",
      description: "The plant has been successfully deleted",
      color: "success",
    });
    showDeletePlantConfirmModal.value = false;
    plantToDelete.value = null;
  } catch (err) {
    console.error("Error deleting plant:", err);
    toast.add({
      title: "Error",
      description: "An error occurred while deleting the plant",
      color: "error",
    });
  } finally {
    deletingPlant.value = false;
  }
};

const getPlantActionItems = (plant: PlantData) => {
  const items: Array<Array<Record<string, unknown>>> = [
    [
      {
        label: "View details",
        icon: "i-heroicons-information-circle-20-solid",
        onSelect: () => openPlantInfoModal(plant),
      },
      {
        label: "Locate on map",
        icon: "i-heroicons-map-pin-20-solid",
        onSelect: () => onLocateRequested(plant),
      },
      {
        label: "Find same variety",
        icon: "i-heroicons-funnel-20-solid",
        onSelect: () => onSearchSameVariety(plant),
      },
      {
        label: "Edit variety",
        icon: "i-heroicons-tag-20-solid",
        onSelect: () => openVarietyEditorFromPlant(plant),
      },
    ],
  ];

  if (isOwner.value) {
    items.push([
      {
        label: "Edit plant",
        icon: "i-heroicons-pencil-square-20-solid",
        onSelect: () => openPlantEditor(plant),
      },
      {
        label: "Delete plant",
        icon: "i-heroicons-trash-20-solid",
        onSelect: () => requestDeletePlant(plant),
      },
    ]);
  }

  return items;
};

watch(
  searchFromQuery,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(searchQuery, async (value) => {
  const normalized = value.trim();
  const nextSearch = normalized.length ? normalized : undefined;
  const currentSearch =
    typeof route.query.search === "string" ? route.query.search : undefined;

  if (currentSearch === nextSearch) {
    return;
  }

  await router.replace({
    query: {
      ...route.query,
      search: nextSearch,
    },
  });
});

const resolveGardenAccess = async (gardenData: GardenData) => {
  const access = await teamsStore.resolveGardenAccess(gardenId, gardenData);
  return access.allowed;
};

const loadData = async () => {
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

    // Ownership check auto-runs via watchEffect in useIsOwner
    await plantsStore.loadGardenPlants(gardenId, { force: true });
  } catch (err) {
    console.error("Error loading data:", err);
    error.value = "Error loading data";
  } finally {
    pending.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

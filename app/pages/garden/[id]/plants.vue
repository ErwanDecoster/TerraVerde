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
              <EditPlantModal
                :plant="row.original"
                :variety-filter-mode="garden?.variety_filter_mode"
                @plant-updated="onPlantUpdated"
                @plant-deleted="onPlantDeleted"
                @plant-copied="onPlantAdded"
                @variety-updated="onVarietyUpdated"
              >
                <UButton
                  icon="i-heroicons-pencil-square-20-solid"
                  size="sm"
                  variant="ghost"
                  @click.stop
                />
              </EditPlantModal>
            </div>
          </template>
        </UTable>
      </UCard>

      <PlantInfoModal
        v-if="selectedPlant && showPlantInfoModal"
        v-model:open="showPlantInfoModal"
        :plant="selectedPlant"
        :can-manage-history="isOwner"
        :show-bulk-tip="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import AddPlantModal from "~/components/plant/AddPlantModal.vue";
import EditPlantModal from "~/components/plant/EditPlantModal.vue";
import PlantInfoModal from "~/components/plant/PlantInfoModal.vue";
import { useIsOwner } from "~/composables/useIsOwner";
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import { PLANT_STATUSES } from "~/types/plant";
import type { VarietyData } from "~/types/variety";

const route = useRoute();
const gardenId = route.params.id as string;

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
const plantsForGarden = computed(() =>
  plantsGardenId.value === gardenId ? plants.value : [],
);

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
  ];

  if (isOwner.value) {
    baseColumns.push({
      id: "actions",
      header: "Actions",
    });
  }

  return baseColumns;
});

const filteredPlants = computed(() => {
  if (!searchQuery.value) return plantsForGarden.value;

  const query = searchQuery.value.toLowerCase();
  return plantsForGarden.value.filter(
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

const openPlantInfoModal = (plant: PlantData) => {
  selectedPlant.value = plant;
  showPlantInfoModal.value = true;
};

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

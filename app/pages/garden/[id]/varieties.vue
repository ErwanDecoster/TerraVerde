<template>
  <div>
    <div v-if="pending" class="flex h-screen items-center justify-center">
      <UIcon
        name="i-heroicons-arrow-path-20-solid"
        class="animate-spin text-4xl"
      />
      <span class="ml-2">Loading varieties...</span>
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
            Varieties - {{ garden?.name }}
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
                ? "Manage all varieties used in the garden"
                : "View all varieties used in this public garden"
            }}
          </p>
        </div>

        <AddVarietyModal
          v-if="isOwner"
          :garden-id="gardenId"
          @variety-added="onVarietyAdded"
        >
          <UButton color="primary" icon="i-heroicons-plus-20-solid">
            Add Variety
          </UButton>
        </AddVarietyModal>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-squares-2x2-20-solid"
              class="h-8 w-8 text-blue-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p class="text-2xl font-semibold">
                {{ varieties.length }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-trees" class="h-8 w-8 text-green-600" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Trees</p>
              <p class="text-2xl font-semibold">
                {{ treeCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-shrub" class="h-8 w-8 text-green-600" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Shrubs</p>
              <p class="text-2xl font-semibold">
                {{ shrubCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-leaf" class="h-8 w-8 text-yellow-600" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Climbers</p>
              <p class="text-2xl font-semibold">
                {{ climberCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-flower-2" class="h-8 w-8 text-pink-500" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Flowers</p>
              <p class="text-2xl font-semibold">
                {{ flowerCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="lucide-carrot" class="h-8 w-8 text-orange-500" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Vegetables</p>
              <p class="text-2xl font-semibold">
                {{ vegetableCount }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Varieties List</h2>
            <div class="flex items-center gap-2">
              <UInput
                v-model="searchQuery"
                icon="i-heroicons-magnifying-glass-20-solid"
                placeholder="Search varieties..."
                size="sm"
              />
            </div>
          </div>
        </template>

        <UTable
          :data="filteredVarieties"
          :columns="columns"
          :loading="pending"
          class="w-full"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-2">
              <div
                v-if="row.original.main_color"
                class="h-4 w-4 rounded-full border"
                :style="{ backgroundColor: row.original.main_color }"
              />
              <div>
                <p class="font-medium">
                  {{ row.original.name }}
                </p>
                <p
                  v-if="row.original.scientific_name"
                  class="text-xs text-gray-500 italic"
                >
                  {{ row.original.scientific_name }}
                </p>
              </div>
            </div>
          </template>

          <template #category-cell="{ row }">
            <UBadge
              :color="getCategoryColor(row.original.category) as any"
              variant="subtle"
            >
              {{ getCategoryLabel(row.original.category) }}
            </UBadge>
          </template>

          <template #harvest_period-cell="{ row }">
            <span v-if="row.original.harvest_period" class="text-sm">
              {{ row.original.harvest_period }}
            </span>
            <span v-else class="text-sm text-gray-400"> Not specified </span>
          </template>

          <template #plant_count-cell="{ row }">
            <div class="flex items-center gap-1">
              <UIcon
                name="i-heroicons-sparkles-20-solid"
                class="h-4 w-4 text-green-500"
              />
              <span>{{
                getPlantCountForVariety(Number(row.original.id))
              }}</span>
            </div>
          </template>

          <template #reference_url-cell="{ row }">
            <UButton
              v-if="row.original.reference_url"
              icon="i-heroicons-link-20-solid"
              size="sm"
              variant="ghost"
              :to="row.original.reference_url"
              target="_blank"
            />
            <span v-else class="text-sm text-gray-400">-</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <EditVarietyModal
                :variety="row.original"
                @variety-updated="onVarietyUpdated"
                @variety-deleted="onVarietyDeleted"
              >
                <UButton
                  icon="i-heroicons-pencil-square-20-solid"
                  size="sm"
                  variant="ghost"
                />
              </EditVarietyModal>
            </div>
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import AddVarietyModal from "~/components/variety/AddVarietyModal.vue";
import EditVarietyModal from "~/components/variety/EditVarietyModal.vue";
import { useIsOwner } from "~/composables/useIsOwner";
import type { GardenData } from "~/types/garden";
import type { VarietyData } from "~/types/variety";
import { getCategoryColor, getCategoryLabel } from "~/utils/plantCategories";

const route = useRoute();
const gardenId = route.params.id as string;

const gardenStore = useGardenStore();
const teamsStore = useTeamsStore();
const plantsStore = usePlantsStore();
const varietiesStore = useVarietiesStore();
const { currentGarden: garden } = storeToRefs(gardenStore);
const { plants, currentGardenId: plantsGardenId } = storeToRefs(plantsStore);
const { currentVarieties: varieties, currentGardenId: varietiesGardenId } =
  storeToRefs(varietiesStore);
const { isOwner } = useIsOwner(gardenId);

const pending = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const plantsForGarden = computed(() =>
  plantsGardenId.value === gardenId ? plants.value : [],
);
const varietiesForGarden = computed(() =>
  varietiesGardenId.value === gardenId ? varieties.value : [],
);

const columns = computed(() => {
  const baseColumns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "harvest_period",
      header: "Harvest Period",
    },
    {
      id: "plant_count",
      header: "Plants Count",
    },
    {
      accessorKey: "reference_url",
      header: "Reference",
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

const filteredVarieties = computed(() => {
  if (!searchQuery.value) return varietiesForGarden.value;

  const query = searchQuery.value.toLowerCase();
  return varietiesForGarden.value.filter(
    (variety) =>
      variety.name.toLowerCase().includes(query) ||
      variety.scientific_name?.toLowerCase().includes(query) ||
      variety.category.toLowerCase().includes(query) ||
      variety.harvest_period?.toLowerCase().includes(query),
  );
});

const treeCount = computed(
  () =>
    varietiesForGarden.value.filter(
      (v) => v.category === "tree" || v.category === "fruit_tree",
    ).length,
);

const shrubCount = computed(
  () => varietiesForGarden.value.filter((v) => v.category === "shrub").length,
);

const climberCount = computed(
  () => varietiesForGarden.value.filter((v) => v.category === "climber").length,
);

const flowerCount = computed(
  () => varietiesForGarden.value.filter((v) => v.category === "flower").length,
);

const vegetableCount = computed(
  () =>
    varietiesForGarden.value.filter((v) => v.category === "vegetable").length,
);

const getPlantCountForVariety = (varietyId: number) => {
  return plantsForGarden.value.filter((plant) => plant.variety_id === varietyId)
    .length;
};

const onVarietyAdded = (variety: VarietyData) => {
  varietiesStore.prependVariety(variety);
};

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  varietiesStore.upsertVariety(updatedVariety);
  plantsStore.syncVarietyInPlants(updatedVariety);
};

const onVarietyDeleted = (varietyId: string) => {
  varietiesStore.removeVariety(varietyId);
  plantsStore.removePlantsByVariety(varietyId);
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

    const plantsData = await plantsStore.loadGardenPlants(gardenId, {
      force: true,
    });

    varietiesStore.hydrateUsedVarieties(gardenId, plantsData);
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

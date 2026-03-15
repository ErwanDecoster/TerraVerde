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
            <UIcon name="i-lucide-tree-pine" class="h-8 w-8 text-green-600" />
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
            <UIcon
              name="i-lucide-tree-deciduous"
              class="h-8 w-8 text-green-600"
            />
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
            <UIcon name="i-lucide-leaf" class="h-8 w-8 text-yellow-600" />
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
            <UIcon name="i-lucide-flower" class="h-8 w-8 text-pink-500" />
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
            <UIcon name="i-lucide-carrot" class="h-8 w-8 text-orange-500" />
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
          class="-m-4 sm:-m-6"
        >
          <template #name-cell="{ row }">
            <div
              class="flex cursor-pointer items-center gap-2"
              @click="openVarietyInfoModal(row.original)"
            >
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
              class="cursor-pointer"
              :color="getCategoryColor(row.original.category) as any"
              variant="subtle"
              @click="openVarietyInfoModal(row.original)"
            >
              {{ getCategoryLabel(row.original.category) }}
            </UBadge>
          </template>

          <template #harvest_period-cell="{ row }">
            <span
              v-if="row.original.harvest_period"
              class="cursor-pointer text-sm"
              @click="openVarietyInfoModal(row.original)"
            >
              {{ row.original.harvest_period }}
            </span>
            <span
              v-else
              class="cursor-pointer text-sm text-gray-400"
              @click="openVarietyInfoModal(row.original)"
            >
              Not specified
            </span>
          </template>

          <template #plant_count-cell="{ row }">
            <div
              class="flex cursor-pointer items-center gap-1"
              @click="openVarietyInfoModal(row.original)"
            >
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
                v-if="isOwner"
                :variety="row.original"
                :open="activeVarietyEditorId === row.original.id"
                :hide-trigger="true"
                @update:open="
                  onVarietyEditorOpenChange(row.original.id, $event)
                "
                @variety-updated="onVarietyUpdated"
                @variety-deleted="onVarietyDeleted"
              />

              <UDropdownMenu :items="getVarietyActionItems(row.original)">
                <UButton
                  label="Actions"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                  size="sm"
                  variant="ghost"
                />
                <template #item-label="{ item }">
                  <UTooltip
                    v-if="item.disabledReason"
                    :content="{ side: 'top' }"
                    :ui="{
                      content: 'max-w-56 whitespace-normal text-sm leading-5',
                    }"
                    :text="String(item.disabledReason)"
                  >
                    <span class="text-muted cursor-not-allowed">
                      {{ item.label }}
                    </span>
                  </UTooltip>
                  <span v-else>{{ item.label }}</span>
                </template>
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </UCard>

      <UModal
        v-model:open="showDeleteVarietyConfirmModal"
        title="Delete Variety"
        description="This action cannot be undone."
      >
        <template #body>
          <p class="text-sm">
            Are you sure you want to delete
            <span class="font-semibold">{{ varietyToDelete?.name }}</span
            >?
          </p>
        </template>

        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              variant="ghost"
              :disabled="deletingVariety"
              @click="showDeleteVarietyConfirmModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-heroicons-trash-20-solid"
              :loading="deletingVariety"
              :disabled="deletingVariety"
              @click="confirmDeleteVariety"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>

      <VarietyInfoModal
        v-if="selectedVariety && showVarietyInfoModal"
        v-model:open="showVarietyInfoModal"
        :variety="selectedVariety"
        :can-search-plants="true"
        @search-plants-requested="onSearchPlantsRequested"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import AddVarietyModal from "~/components/variety/AddVarietyModal.vue";
import EditVarietyModal from "~/components/variety/EditVarietyModal.vue";
import VarietyInfoModal from "~/components/variety/VarietyInfoModal.vue";
import { useIsOwner } from "~/composables/useIsOwner";
import type { GardenData } from "~/types/garden";
import type { TeamData, TeamMemberData } from "~/types/team";
import type { VarietyData } from "~/types/variety";
import { getCategoryColor, getCategoryLabel } from "~/utils/plantCategories";

const route = useRoute();
const router = useRouter();
const gardenId = route.params.id as string;
const toast = useToast();

const authStore = useAuthStore();
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
const selectedVariety = ref<VarietyData | null>(null);
const showVarietyInfoModal = ref(false);
const showDeleteVarietyConfirmModal = ref(false);
const varietyToDelete = ref<VarietyData | null>(null);
const deletingVariety = ref(false);
const activeVarietyEditorId = ref<string | null>(null);
const canEditVarietyById = ref<Record<string, boolean>>({});
const permissionLoadingByVarietyId = ref<Record<string, boolean>>({});
const plantsForGarden = computed(() =>
  plantsGardenId.value === gardenId ? plants.value : [],
);
const varietiesForGarden = computed(() =>
  varietiesGardenId.value === gardenId ? varieties.value : [],
);
const searchFromQuery = computed(() => {
  const value = route.query.search;
  return typeof value === "string" ? value : "";
});

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
    {
      id: "actions",
      header: "Actions",
    },
  ];

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

const openVarietyInfoModal = (variety: VarietyData) => {
  selectedVariety.value = variety;
  showVarietyInfoModal.value = true;
};

const onSearchPlantsRequested = async (variety: VarietyData) => {
  showVarietyInfoModal.value = false;

  await navigateTo({
    path: `/garden/${gardenId}/plants`,
    query: {
      search: variety.name,
      varietyId: variety.id,
    },
  });
};

const requestDeleteVariety = (variety: VarietyData) => {
  varietyToDelete.value = variety;
  showDeleteVarietyConfirmModal.value = true;
};

const openVarietyEditor = (variety: VarietyData) => {
  activeVarietyEditorId.value = variety.id;
};

const canEditVarietyFromOriginalGarden = (variety: VarietyData) => {
  return canEditVarietyById.value[variety.id] === true;
};

const isVarietyEditPermissionLoading = (variety: VarietyData) => {
  return permissionLoadingByVarietyId.value[variety.id] === true;
};

const getEditVarietyDisabledReason = (variety: VarietyData) => {
  if (isVarietyEditPermissionLoading(variety)) {
    return "Checking permissions...";
  }

  if (canEditVarietyFromOriginalGarden(variety)) {
    return undefined;
  }

  return "This variety belongs to another garden. Only members with owner or editor access in that garden can modify it.";
};

const syncVarietyEditPermissions = async (varietyRows: VarietyData[]) => {
  if (!authStore.user) {
    await authStore.initialize();
  }

  const userId = authStore.user?.id;
  if (!userId) {
    const denied: Record<string, boolean> = {};
    varietyRows.forEach((variety) => {
      denied[variety.id] = false;
    });
    canEditVarietyById.value = denied;
    permissionLoadingByVarietyId.value = {};
    return;
  }

  const gardenIds = [
    ...new Set(
      varietyRows
        .map((variety) => variety.garden_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const loadingState: Record<string, boolean> = {};
  varietyRows.forEach((variety) => {
    loadingState[variety.id] = true;
  });
  permissionLoadingByVarietyId.value = loadingState;

  const canEditByGardenId: Record<string, boolean> = {};

  await Promise.all(
    gardenIds.map(async (originalGardenId) => {
      try {
        const teams = await teamsStore.fetchGardenTeams(originalGardenId);
        canEditByGardenId[originalGardenId] = teams.some((team: TeamData) =>
          team.teams_members?.some(
            (member: TeamMemberData) =>
              member.user_id === userId &&
              ["owner", "editor"].includes(member.role || ""),
          ),
        );
      } catch (permissionError) {
        console.error(
          "Failed to compute variety edit permission",
          permissionError,
        );
        canEditByGardenId[originalGardenId] = false;
      }
    }),
  );

  const nextPermissions: Record<string, boolean> = {};
  varietyRows.forEach((variety) => {
    const originalGardenId = variety.garden_id;
    nextPermissions[variety.id] =
      typeof originalGardenId === "string"
        ? canEditByGardenId[originalGardenId] === true
        : false;
  });

  canEditVarietyById.value = nextPermissions;
  permissionLoadingByVarietyId.value = {};
};

const onVarietyEditorOpenChange = (varietyId: string, isOpen: boolean) => {
  if (!isOpen && activeVarietyEditorId.value === varietyId) {
    activeVarietyEditorId.value = null;
  }
};

const confirmDeleteVariety = async () => {
  if (!varietyToDelete.value) return;

  deletingVariety.value = true;
  try {
    await varietiesStore.deleteExistingVariety(varietyToDelete.value.id);
    plantsStore.removePlantsByVariety(varietyToDelete.value.id);
    toast.add({
      title: "Variety Deleted",
      description: "The variety has been successfully deleted",
      color: "success",
    });
    showDeleteVarietyConfirmModal.value = false;
    varietyToDelete.value = null;
  } catch (err) {
    console.error("Error deleting variety:", err);
    toast.add({
      title: "Error",
      description: "An error occurred while deleting the variety",
      color: "error",
    });
  } finally {
    deletingVariety.value = false;
  }
};

const getVarietyActionItems = (variety: VarietyData) => {
  const canEditVariety = canEditVarietyFromOriginalGarden(variety);
  const editVarietyDisabledReason = getEditVarietyDisabledReason(variety);

  const items: Array<Array<Record<string, unknown>>> = [
    [
      {
        label: "View details",
        icon: "i-heroicons-information-circle-20-solid",
        onSelect: () => openVarietyInfoModal(variety),
      },
      {
        label: "Find plants",
        icon: "i-heroicons-funnel-20-solid",
        onSelect: () => onSearchPlantsRequested(variety),
      },
      ...(variety.reference_url
        ? [
            {
              label: "Open reference",
              icon: "i-heroicons-link-20-solid",
              onSelect: () =>
                globalThis.window?.open(
                  variety.reference_url as string,
                  "_blank",
                  "noopener,noreferrer",
                ),
            },
          ]
        : []),
      {
        label: "Edit variety",
        icon: "i-heroicons-pencil-square-20-solid",
        disabled: canEditVariety === false,
        disabledReason: editVarietyDisabledReason,
        onSelect: () => {
          if (!canEditVariety) return;
          openVarietyEditor(variety);
        },
      },
    ],
  ];

  if (isOwner.value) {
    items.push([
      {
        label: "Delete variety",
        icon: "i-heroicons-trash-20-solid",
        onSelect: () => requestDeleteVariety(variety),
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

    const plantsData = await plantsStore.loadGardenPlants(gardenId, {
      force: true,
    });

    varietiesStore.hydrateUsedVarieties(gardenId, plantsData);
    await syncVarietyEditPermissions(varietiesStore.currentVarieties);
  } catch (err) {
    console.error("Error loading data:", err);
    error.value = "Error loading data";
  } finally {
    pending.value = false;
  }
};

watch(
  varietiesForGarden,
  async (value) => {
    if (pending.value) return;
    await syncVarietyEditPermissions(value);
  },
  { deep: true },
);

onMounted(() => {
  loadData();
});
</script>

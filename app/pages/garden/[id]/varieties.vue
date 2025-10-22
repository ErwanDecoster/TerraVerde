<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="pending"
      class="flex justify-center items-center h-screen"
    >
      <UIcon
        name="i-heroicons-arrow-path-20-solid"
        class="animate-spin text-4xl"
      />
      <span class="ml-2">Loading varieties...</span>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex justify-center items-center h-screen"
    >
      <UAlert
        icon="i-heroicons-exclamation-triangle-20-solid"
        color="error"
        variant="subtle"
        title="Error"
        :description="error"
      />
    </div>

    <!-- Main content -->
    <div
      v-else
      class="p-4"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-left-20-solid"
              @click="navigateTo(`/garden/${gardenId}`)"
            >
              Back to Garden
            </UButton>
          </div>
          <h1 class="text-3xl font-bold mt-2">
            Varieties - {{ garden?.name }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage all varieties used in the garden
          </p>
        </div>

        <AddVarietyModal @variety-added="onVarietyAdded">
          <UButton
            color="primary"
            icon="i-heroicons-plus-20-solid"
          >
            Add Variety
          </UButton>
        </AddVarietyModal>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-squares-2x2-20-solid"
              class="w-8 h-8 text-blue-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total
              </p>
              <p class="text-2xl font-semibold">
                {{ varieties.length }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-tree-pine-20-solid"
              class="w-8 h-8 text-green-600"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Trees
              </p>
              <p class="text-2xl font-semibold">
                {{ treeCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-sparkles-20-solid"
              class="w-8 h-8 text-pink-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Flowers
              </p>
              <p class="text-2xl font-semibold">
                {{ flowerCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-beaker-20-solid"
              class="w-8 h-8 text-orange-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Vegetables
              </p>
              <p class="text-2xl font-semibold">
                {{ vegetableCount }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Varieties table -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Varieties List
            </h2>
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
                class="w-4 h-4 rounded-full border"
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
            <span
              v-if="row.original.harvest_period"
              class="text-sm"
            >
              {{ row.original.harvest_period }}
            </span>
            <span
              v-else
              class="text-sm text-gray-400"
            > Not specified </span>
          </template>

          <template #plant_count-cell="{ row }">
            <div class="flex items-center gap-1">
              <UIcon
                name="i-heroicons-sparkles-20-solid"
                class="w-4 h-4 text-green-500"
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
              color="neutral"
              variant="ghost"
              :to="row.original.reference_url"
              target="_blank"
            />
            <span
              v-else
              class="text-gray-400 text-sm"
            >-</span>
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
                  color="neutral"
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
import type { VarietyData } from '~/types/variety'
import type { PlantData } from '~/types/plant'
import type { GardenData } from '~/types/garden'
import { useGarden } from '~/composables/data/useGarden'
import { usePlant } from '~/composables/data/usePlant'
import { useVariety } from '~/composables/data/useVariety'
import AddVarietyModal from '~/components/variety/AddVarietyModal.vue'
import EditVarietyModal from '~/components/variety/EditVarietyModal.vue'

// Page meta
definePageMeta({
  middleware: ['auth'],
})

// Get route params
const route = useRoute()
const gardenId = route.params.id as string

// Composables
const { fetchGardenById } = useGarden()
const { fetchPlants } = usePlant()
const { fetchVarieties } = useVariety()

// State
const garden = ref<GardenData | null>(null)
const varieties = ref<VarietyData[]>([])
const plants = ref<PlantData[]>([])
const pending = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Table columns configuration
const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'harvest_period',
    header: 'Harvest Period',
  },
  {
    id: 'plant_count',
    header: 'Plants Count',
  },
  {
    accessorKey: 'reference_url',
    header: 'Reference',
  },
  {
    id: 'actions',
    header: 'Actions',
  },
]

// Computed properties
const filteredVarieties = computed(() => {
  if (!searchQuery.value) return varieties.value

  const query = searchQuery.value.toLowerCase()
  return varieties.value.filter(
    variety =>
      variety.name.toLowerCase().includes(query)
      || variety.scientific_name?.toLowerCase().includes(query)
      || variety.category.toLowerCase().includes(query)
      || variety.harvest_period?.toLowerCase().includes(query),
  )
})

const treeCount = computed(
  () =>
    varieties.value.filter(
      v => v.category === 'arbre' || v.category === 'arbre_fruitier',
    ).length,
)

const flowerCount = computed(
  () => varieties.value.filter(v => v.category === 'fleur').length,
)

const vegetableCount = computed(
  () => varieties.value.filter(v => v.category === 'legume').length,
)

// Helper functions
const getCategoryColor = (category: string) => {
  const categoryColors = {
    arbre: 'success',
    arbre_fruitier: 'warning',
    arbuste: 'info',
    fleur: 'secondary',
    legume: 'primary',
    herbe: 'success',
    autre: 'neutral',
  }
  return categoryColors[category as keyof typeof categoryColors] || 'neutral'
}

const getCategoryLabel = (category: string) => {
  const categoryLabels = {
    arbre: 'Tree',
    arbre_fruitier: 'Fruit Tree',
    arbuste: 'Shrub',
    fleur: 'Flower',
    legume: 'Vegetable',
    herbe: 'Grass',
    autre: 'Other',
  }
  return categoryLabels[category as keyof typeof categoryLabels] || category
}

const getPlantCountForVariety = (varietyId: number) => {
  return plants.value.filter(plant => plant.variety_id === varietyId).length
}

// Event handlers
const onVarietyAdded = (variety: VarietyData) => {
  varieties.value.unshift(variety)
}

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  const index = varieties.value.findIndex(v => v.id === updatedVariety.id)
  if (index !== -1) {
    varieties.value[index] = updatedVariety
  }
}

const onVarietyDeleted = (varietyId: string) => {
  varieties.value = varieties.value.filter(
    v => v.id.toString() !== varietyId,
  )
}

// Load data
const loadData = async () => {
  try {
    pending.value = true
    error.value = null

    // Load garden data
    const gardenData = await fetchGardenById(gardenId)
    if (!gardenData) {
      error.value = 'Garden not found'
      return
    }
    garden.value = gardenData

    // Load varieties and plants
    const [varietiesData, plantsData] = await Promise.all([
      fetchVarieties(),
      fetchPlants(gardenId),
    ])

    varieties.value = varietiesData
    plants.value = plantsData
  }
  catch (err) {
    console.error('Error loading data:', err)
    error.value = 'Error loading data'
  }
  finally {
    pending.value = false
  }
}

// Initialize
onMounted(() => {
  loadData()
})
</script>

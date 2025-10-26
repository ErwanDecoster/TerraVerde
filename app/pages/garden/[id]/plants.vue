<template>
  <div>
    <div
      v-if="pending"
      class="flex justify-center items-center h-screen"
    >
      <UIcon
        name="i-heroicons-arrow-path-20-solid"
        class="animate-spin text-4xl"
      />
      <span class="ml-2">Loading plants...</span>
    </div>

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

    <div
      v-else
      class="p-4"
    >
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
          <p class="text-gray-600 dark:text-gray-400 mt-1">
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
          @plant-added="onPlantAdded"
          @variety-updated="onVarietyUpdated"
        >
          <UButton
            color="primary"
            icon="i-heroicons-plus-20-solid"
          >
            Add Plant
          </UButton>
        </AddPlantModal>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-sparkles-20-solid"
              class="w-8 h-8 text-green-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Total
              </p>
              <p class="text-2xl font-semibold">
                {{ plants.length }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-heart-20-solid"
              class="w-8 h-8 text-emerald-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Healthy
              </p>
              <p class="text-2xl font-semibold">
                {{ healthyCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-exclamation-triangle-20-solid"
              class="w-8 h-8 text-yellow-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Sick
              </p>
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
              class="w-8 h-8 text-blue-500"
            />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Varieties
              </p>
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
            <h2 class="text-xl font-semibold">
              Plants List
            </h2>
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
          class="w-full"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded-full border"
                :style="{ backgroundColor: row.original.variety.main_color || '#CCCCCC' }"
              />
              <span class="font-medium">{{ row.original.name }}</span>
            </div>
          </template>

          <template #variety-cell="{ row }">
            <div>
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
              :color="getStatusColor(row.original.status)"
              variant="subtle"
            >
              {{ getStatusLabel(row.original.status) }}
            </UBadge>
          </template>

          <template #planted_date-cell="{ row }">
            {{ formatDate(row.original.planted_date) }}
          </template>

          <template #dimensions-cell="{ row }">
            {{ row.original.height }}m × {{ row.original.width }}m
          </template>

          <template #position-cell="{ row }">
            <span class="text-sm text-gray-500">
              ({{ row.original.x_position?.toFixed(1) || 0 }},
              {{ row.original.y_position?.toFixed(1) || 0 }})
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <EditPlantModal
                :plant="row.original"
                @plant-updated="onPlantUpdated"
                @plant-deleted="onPlantDeleted"
                @plant-copied="onPlantAdded"
                @variety-updated="onVarietyUpdated"
              >
                <UButton
                  icon="i-heroicons-pencil-square-20-solid"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                />
              </EditPlantModal>
            </div>
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlantData } from '~/types/plant'
import type { VarietyData } from '~/types/variety'
import type { GardenData } from '~/types/garden'
import { PLANT_STATUSES } from '~/types/plant'
import { useGarden } from '~/composables/data/useGarden'
import { usePlant } from '~/composables/data/usePlant'
import { useVarietySync } from '~/composables/data/useVarietySync'
import AddPlantModal from '~/components/plant/AddPlantModal.vue'
import EditPlantModal from '~/components/plant/EditPlantModal.vue'

const route = useRoute()
const gardenId = route.params.id as string

const { user } = useAuth()
const { fetchGardenById } = useGarden()
const { fetchPlants } = usePlant()
const { syncVarietyInPlants } = useVarietySync()

const isOwner = computed(() => {
  return Boolean(
    user.value
    && garden.value?.user_id
    && user.value.id === garden.value.user_id,
  )
})

const garden = ref<GardenData | null>(null)
const plants = ref<PlantData[]>([])
const pending = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

const columns = computed(() => {
  const baseColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'variety',
      header: 'Variety',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'planted_date',
      header: 'Planted Date',
    },
    {
      id: 'dimensions',
      header: 'Dimensions',
    },
    {
      id: 'position',
      header: 'Position',
    },
  ]

  if (isOwner.value) {
    baseColumns.push({
      id: 'actions',
      header: 'Actions',
    })
  }

  return baseColumns
})

const filteredPlants = computed(() => {
  if (!searchQuery.value) return plants.value

  const query = searchQuery.value.toLowerCase()
  return plants.value.filter(
    plant =>
      plant.name.toLowerCase().includes(query)
      || plant.variety.name.toLowerCase().includes(query)
      || plant.variety.scientific_name?.toLowerCase().includes(query)
      || plant.description.toLowerCase().includes(query),
  )
})

const healthyCount = computed(
  () => plants.value.filter(plant => plant.status === 'healthy').length,
)

const sickCount = computed(
  () => plants.value.filter(plant => plant.status === 'sick').length,
)

const varietiesCount = computed(() => {
  const uniqueVarietyIds = new Set(
    plants.value
      .filter(plant => plant.variety_id)
      .map(plant => plant.variety_id),
  )
  return uniqueVarietyIds.size
})

const getStatusColor = (status: string) => {
  const statusConfig = PLANT_STATUSES.find(s => s.value === status)
  return statusConfig?.color || 'neutral'
}

const getStatusLabel = (status: string) => {
  const statusConfig = PLANT_STATUSES.find(s => s.value === status)
  return statusConfig?.label || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const onPlantAdded = (plant: PlantData) => {
  plants.value.unshift(plant)
}

const onPlantUpdated = (updatedPlant: PlantData) => {
  const index = plants.value.findIndex(p => p.id === updatedPlant.id)
  if (index !== -1) {
    plants.value[index] = updatedPlant
  }
}

const onPlantDeleted = (plantId: string) => {
  plants.value = plants.value.filter(p => p.id !== plantId)
}

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  syncVarietyInPlants(plants, updatedVariety)
}

const loadData = async () => {
  try {
    pending.value = true
    error.value = null

    const gardenData = await fetchGardenById(gardenId)
    if (!gardenData) {
      error.value = 'Garden not found'
      return
    }

    if (
      !gardenData.is_public
      && (!user.value || user.value.id !== gardenData.user_id)
    ) {
      error.value = 'Access denied. This garden is private.'
      return
    }

    garden.value = gardenData
    plants.value = await fetchPlants(gardenId)
  }
  catch (err) {
    console.error('Error loading data:', err)
    error.value = 'Error loading data'
  }
  finally {
    pending.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

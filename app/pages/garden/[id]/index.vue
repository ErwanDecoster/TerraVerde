<template>
  <div
    v-if="pending"
    class="flex justify-center items-center h-screen"
  >
    <UIcon
      name="i-heroicons-arrow-path-20-solid"
      class="animate-spin text-4xl"
    />
    <span class="ml-2">Loading garden...</span>
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
    v-else-if="!garden"
    class="flex justify-center items-center h-screen"
  >
    <UAlert
      icon="i-heroicons-information-circle-20-solid"
      color="warning"
      variant="subtle"
      title="Garden not found"
      description="The requested garden could not be found."
    />
  </div>

  <div
    v-else
    class="h-screen overflow-hidden"
  >
    <div class="flex-1 overflow-hidden relative">
      <GardenHeader
        :garden="garden"
        :plants="plants"
        :is-editing-enabled="isEditingEnabled"
        @garden-updated="loadGarden"
        @update:editing-enabled="isEditingEnabled = $event"
      />

      <GardenZoomControls
        :stage-config="stageConfig"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset-zoom="resetZoom"
      />

      <PlantCategoryFilters v-model:visible-categories="visibleCategories" />

      <PlantHoverData
        v-if="hoveredPlant"
        :plant="hoveredPlant"
      />

      <GardenCanvas
        ref="canvas"
        :stage-config="stageConfig"
        :background="background"
        :background-config="backgroundConfig"
        :plant-markers="plantMarkers"
        :is-editing-enabled="isEditingEnabled"
        :handle-wheel="handleWheel"
        :handle-plant-click="handlePlantClick"
        :handle-plant-drag-start="handlePlantDragStart"
        :handle-plant-drag-end="handlePlantDragEnd"
        :handle-plant-hover="handlePlantHover"
        :get-category-letter="getCategoryLetter"
        :handle-background-click="handleBackgroundClick"
      />
    </div>

    <AddPlantModal
      v-if="showAddPlantModal"
      v-model:open="showAddPlantModal"
      :garden-id="gardenId"
      :click-coordinates="clickCoordinates"
      @plant-added="onPlantAdded"
      @variety-updated="onVarietyUpdated"
    />

    <PlantInfoModal
      v-if="selectedPlant && showPlantInfoModal"
      v-model:open="showPlantInfoModal"
      :plant="selectedPlant"
      @edit-requested="onEditRequested"
    />

    <EditPlantModal
      v-if="selectedPlant && showEditPlantModal"
      v-model:open="showEditPlantModal"
      :plant="selectedPlant"
      @plant-updated="onPlantUpdated"
      @plant-deleted="onPlantDeleted"
      @plant-copied="onPlantCopied"
      @variety-updated="onVarietyUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'
import type { VarietyData } from '~/types/variety'
import { useGarden } from '~/composables/data/useGarden'
import { usePlant } from '~/composables/data/usePlant'
import { useGardenZoom } from '~/composables/garden/useGardenZoom'
import { useGardenCanvas } from '~/composables/garden/useGardenCanvas'
import { usePlantMarkers } from '~/composables/garden/usePlantMarkers'
import { usePlantInteractions } from '~/composables/garden/usePlantInteractions'
import { useVarietySync } from '~/composables/data/useVarietySync'
import GardenHeader from '~/components/garden/GardenHeader.vue'
import GardenZoomControls from '~/components/garden/GardenZoomControls.vue'
import GardenCanvas from '~/components/garden/GardenCanvas.vue'
import PlantCategoryFilters from '~/components/garden/PlantCategoryFilters.vue'
import PlantHoverData from '~/components/garden/PlantHoverData.vue'
import AddPlantModal from '~/components/plant/AddPlantModal.vue'
import EditPlantModal from '~/components/plant/EditPlantModal.vue'
import PlantInfoModal from '~/components/plant/PlantInfoModal.vue'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const gardenId = route.params.id as string

const { fetchGardenById } = useGarden()
const { fetchPlants, updatePlant } = usePlant()
const { syncVarietyInPlants } = useVarietySync()

const visibleCategories = ref<string[]>([
  'tree',
  'fruit_tree',
  'shrub',
  'flower',
  'climber',
  'vegetable',
  'grass',
  'aquatic',
  'other',
])

const garden = ref<GardenData>({} as GardenData)
const plants = ref<PlantData[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

const showAddPlantModal = ref(false)
const showEditPlantModal = ref(false)
const showPlantInfoModal = ref(false)
const selectedPlant = ref<PlantData | null>(null)

const isEditingEnabled = ref(false)

interface KonvaStage {
  scaleX: () => number
  scaleY: () => number
  x: () => number
  y: () => number
  width: () => number
  height: () => number
  scale: (scale: { x: number, y: number }) => void
  position: (pos: { x: number, y: number }) => void
  batchDraw: () => void
  getPointerPosition: () => { x: number, y: number } | null
}

const canvas = ref<{ stage: { getStage: () => KonvaStage } } | null>(null)

const { stageConfig, handleWheel, zoomIn, zoomOut, resetZoom, handleResize }
  = useGardenZoom(
    computed(() => canvas.value?.stage || null),
    computed(() => backgroundConfig),
  )

const { background, backgroundConfig, loadBackgroundImage }
  = useGardenCanvas(resetZoom)

const { plantMarkers, getCategoryLetter } = usePlantMarkers(
  plants,
  visibleCategories,
  garden,
)

const clickCoordinates = ref<{ x: number, y: number } | null>(null)

const onPlantClick = (plant: PlantData) => {
  selectedPlant.value = plant

  if (isEditingEnabled.value) {
    showEditPlantModal.value = true
  }
  else {
    showPlantInfoModal.value = true
  }
}

const handleBackgroundClick = (event: Event) => {
  if (!isEditingEnabled.value) return

  if (!event.target) return

  const stage = event.target.getStage()
  const clickedElement = event.target

  if (clickedElement === stage || clickedElement.attrs?.name === 'background') {
    const pointer = stage.getPointerPosition()

    if (pointer) {
      const stageX = stage.x()
      const stageY = stage.y()
      const scaleX = stage.scaleX()
      const scaleY = stage.scaleY()

      const imageX = (pointer.x - stageX) / scaleX
      const imageY = (pointer.y - stageY) / scaleY

      clickCoordinates.value = { x: imageX, y: imageY }
    }
    showAddPlantModal.value = true
  }
}

const onPlantAdded = (newPlant: PlantData) => {
  plants.value.push(newPlant)
  showAddPlantModal.value = false
  clickCoordinates.value = null
}

const onPlantUpdated = (updatedPlant: PlantData) => {
  const index = plants.value.findIndex(p => p.id === updatedPlant.id)
  if (index !== -1) {
    plants.value[index] = updatedPlant
  }
  showEditPlantModal.value = false
  selectedPlant.value = null
}

const onPlantPositionUpdated = (updatedPlant: PlantData) => {
  const index = plants.value.findIndex(p => p.id === updatedPlant.id)
  if (index !== -1) {
    plants.value[index] = updatedPlant
  }
}

const onPlantDeleted = (plantId: string) => {
  plants.value = plants.value.filter(p => p.id !== plantId)
  showEditPlantModal.value = false
  selectedPlant.value = null
}

const onPlantCopied = (copiedPlant: PlantData) => {
  plants.value.push(copiedPlant)
}

const onEditRequested = (plant: PlantData) => {
  selectedPlant.value = plant
  showPlantInfoModal.value = false
  showEditPlantModal.value = true
}

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  syncVarietyInPlants(plants, updatedVariety)
}

const {
  hoveredPlant,
  handlePlantClick,
  handlePlantDragStart,
  handlePlantDragEnd,
  handlePlantHover,
} = usePlantInteractions(
  garden,
  gardenId,
  updatePlant,
  onPlantClick,
  isEditingEnabled,
  onPlantPositionUpdated,
)

const loadGarden = async () => {
  try {
    pending.value = true
    error.value = null

    const gardenData = await fetchGardenById(gardenId)

    if (!gardenData) {
      error.value = 'Garden not found'
      return
    }

    garden.value = gardenData

    if (gardenData.background_image_url) {
      loadBackgroundImage(gardenData.background_image_url, gardenData)
    }

    if (gardenData.image_width && gardenData.image_height) {
      stageConfig.width = gardenData.image_width
      stageConfig.height = gardenData.image_height
      backgroundConfig.width = gardenData.image_width
      backgroundConfig.height = gardenData.image_height
    }

    await loadPlants()
  }
  catch (err) {
    console.error('Error loading garden:', err)
    error.value = 'Failed to load garden data'
  }
  finally {
    pending.value = false
  }
}

const loadPlants = async () => {
  try {
    plants.value = await fetchPlants(gardenId)

    await nextTick()
    setTimeout(() => {
      resetZoom()
    }, 200)
  }
  catch (err) {
    console.error('Error loading plants:', err)
  }
}

onMounted(() => {
  loadGarden()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

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
      <!-- Garden Header -->
      <GardenHeader
        :garden="garden"
        :plants-count="plants.length"
        :is-editing-enabled="isEditingEnabled"
        @garden-updated="loadGarden"
        @update:editing-enabled="isEditingEnabled = $event"
      />

      <!-- Zoom Controls -->
      <GardenZoomControls
        :stage-config="stageConfig"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset-zoom="resetZoom"
      />

      <!-- Plant Category Filters -->
      <PlantCategoryFilters v-model:visible-categories="visibleCategories" />

      <!-- Plant Hover Data -->
      <PlantHoverData
        v-if="hoveredPlant"
        :plant="hoveredPlant"
      />

      <!-- Garden Canvas -->
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

    <!-- Modals -->
    <AddPlantModal
      v-if="showAddPlantModal"
      v-model:open="showAddPlantModal"
      :garden-id="gardenId"
      :click-coordinates="clickCoordinates"
      @plant-added="onPlantAdded"
    />

    <EditPlantModal
      v-if="selectedPlant && showEditPlantModal"
      v-model:open="showEditPlantModal"
      :plant="selectedPlant"
      @plant-updated="onPlantUpdated"
      @plant-deleted="onPlantDeleted"
      @plant-copied="onPlantCopied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'
import { useGarden } from '~/composables/data/useGarden'
import { usePlant } from '~/composables/data/usePlant'
import { useGardenZoom } from '~/composables/garden/useGardenZoom'
import { useGardenCanvas } from '~/composables/garden/useGardenCanvas'
import { usePlantMarkers } from '~/composables/garden/usePlantMarkers'
import { usePlantInteractions } from '~/composables/garden/usePlantInteractions'
import GardenHeader from '~/components/garden/GardenHeader.vue'
import GardenZoomControls from '~/components/garden/GardenZoomControls.vue'
import GardenCanvas from '~/components/garden/GardenCanvas.vue'
import PlantCategoryFilters from '~/components/garden/PlantCategoryFilters.vue'
import PlantHoverData from '~/components/garden/PlantHoverData.vue'
import AddPlantModal from '~/components/plant/AddPlantModal.vue'
import EditPlantModal from '~/components/plant/EditPlantModal.vue'

// Page meta
definePageMeta({
  middleware: ['auth'],
})

// Get route params
const route = useRoute()
const gardenId = route.params.id as string

// Composables
const { fetchGardenById } = useGarden()
const { fetchPlants, updatePlant } = usePlant()

// Plant category filters state
const visibleCategories = ref<string[]>([
  'arbre',
  'arbre_fruitier',
  'arbuste',
  'fleur',
  'legume',
  'herbe',
  'autre',
])

// Reactive state
const garden = ref<GardenData>({} as GardenData)
const plants = ref<PlantData[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

// Modal states
const showAddPlantModal = ref(false)
const showEditPlantModal = ref(false)
const selectedPlant = ref<PlantData | null>(null)

// Editing mode state
const isEditingEnabled = ref(false)

// Canvas ref
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

// Initialize composables
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

// Coordonnées pour les nouvelles plantes
const clickCoordinates = ref<{ x: number, y: number } | null>(null)

// Modal interaction handlers
const onPlantClick = (plant: PlantData) => {
  // Only allow plant editing if editing mode is enabled
  if (!isEditingEnabled.value) return

  selectedPlant.value = plant
  showEditPlantModal.value = true
}

const handleBackgroundClick = (event: Event) => {
  // Only allow adding plants if editing mode is enabled
  if (!isEditingEnabled.value) return

  if (!event.target) return

  // Vérifier que le clic est sur le background et non sur un marker
  const stage = event.target.getStage()
  const clickedElement = event.target

  // Si le clic est sur le stage ou l'image de fond (pas sur un marker)
  if (clickedElement === stage || clickedElement.attrs?.name === 'background') {
    const pointer = stage.getPointerPosition()

    if (pointer) {
      const stageX = stage.x()
      const stageY = stage.y()
      const scaleX = stage.scaleX()
      const scaleY = stage.scaleY()

      const imageX = (pointer.x - stageX) / scaleX
      const imageY = (pointer.y - stageY) / scaleY

      console.log('Screen coordinates:', pointer.x, pointer.y)
      console.log('Stage transform:', { x: stageX, y: stageY, scaleX, scaleY })
      console.log('Image coordinates:', imageX, imageY)

      clickCoordinates.value = { x: imageX, y: imageY }
    }
    showAddPlantModal.value = true
  }
}

// Plant CRUD handlers
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

const onPlantDeleted = (plantId: string) => {
  plants.value = plants.value.filter(p => p.id !== plantId)
  showEditPlantModal.value = false
  selectedPlant.value = null
}

const onPlantCopied = (copiedPlant: PlantData) => {
  plants.value.push(copiedPlant)
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
)

// Load garden data and plants
const loadGarden = async () => {
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

    // Load the garden's background image
    if (gardenData.background_image_url) {
      loadBackgroundImage(gardenData.background_image_url, gardenData)
    }

    // Update stage config with garden dimensions if available
    if (gardenData.image_width && gardenData.image_height) {
      stageConfig.width = gardenData.image_width
      stageConfig.height = gardenData.image_height
      backgroundConfig.width = gardenData.image_width
      backgroundConfig.height = gardenData.image_height
    }

    // Load plants for this garden
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

// Load plants
const loadPlants = async () => {
  try {
    plants.value = await fetchPlants(gardenId)

    // Appliquer le resetZoom après que tout soit chargé
    await nextTick()
    setTimeout(() => {
      resetZoom()
    }, 200)
  }
  catch (err) {
    console.error('Error loading plants:', err)
    // Don't show error for plants, just continue without them
  }
}

// Setup resize listener
onMounted(() => {
  loadGarden()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

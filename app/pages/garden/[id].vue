<template>
  <div v-if="pending" class="flex justify-center items-center h-screen">
    <UIcon
      name="i-heroicons-arrow-path-20-solid"
      class="animate-spin text-4xl"
    />
    <span class="ml-2">Loading garden...</span>
  </div>

  <div v-else-if="error" class="flex justify-center items-center h-screen">
    <UAlert
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Error"
      :description="error"
    />
  </div>

  <div v-else-if="!garden" class="flex justify-center items-center h-screen">
    <UAlert
      icon="i-heroicons-information-circle-20-solid"
      color="warning"
      variant="subtle"
      title="Garden not found"
      description="The requested garden could not be found."
    />
  </div>

  <div v-else class="h-screen overflow-hidden">
    <div class="flex-1 overflow-hidden relative">
      <!-- Garden Header -->
      <GardenHeader
        :garden="garden"
        :plants-count="plants.length"
        @garden-updated="loadGarden"
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

      <!-- Garden Canvas -->
      <GardenCanvas
        ref="canvas"
        :stage-config="stageConfig"
        :background="background"
        :background-config="backgroundConfig"
        :plant-markers="plantMarkers"
        :handle-wheel="handleWheel"
        :handle-plant-click="handlePlantClick"
        :handle-plant-drag-start="handlePlantDragStart"
        :handle-plant-drag-end="handlePlantDragEnd"
        :handle-plant-hover="handlePlantHover"
        :get-category-letter="getCategoryLetter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import { useGarden } from "~/composables/data/useGarden";
import { usePlant } from "~/composables/data/usePlant";
import { useGardenZoom } from "~/composables/garden/useGardenZoom";
import { useGardenCanvas } from "~/composables/garden/useGardenCanvas";
import { usePlantMarkers } from "~/composables/garden/usePlantMarkers";
import { usePlantInteractions } from "~/composables/garden/usePlantInteractions";
import GardenHeader from "~/components/garden/GardenHeader.vue";
import GardenZoomControls from "~/components/garden/GardenZoomControls.vue";
import GardenCanvas from "~/components/garden/GardenCanvas.vue";
import PlantCategoryFilters from "~/components/garden/PlantCategoryFilters.vue";

// Page meta
definePageMeta({
  middleware: ["auth"],
});

// Get route params
const route = useRoute();
const gardenId = route.params.id as string;

// Composables
const { fetchGardenById } = useGarden();
const { fetchPlants, updatePlant } = usePlant();

// Plant category filters state
const visibleCategories = ref<string[]>([
  "arbre",
  "arbre_fruitier",
  "arbuste",
  "fleur",
  "legume",
  "herbe",
  "autre",
]);

// Reactive state
const garden = ref<GardenData | null>(null);
const plants = ref<PlantData[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

// Canvas ref
const canvas = ref(null);

// Initialize composables
const { stageConfig, handleWheel, zoomIn, zoomOut, resetZoom, handleResize } =
  useGardenZoom(
    computed(() => canvas.value?.stage),
    computed(() => backgroundConfig)
  );

const { background, backgroundConfig, loadBackgroundImage } =
  useGardenCanvas(resetZoom);

const { plantMarkers, getCategoryLetter } = usePlantMarkers(
  plants,
  visibleCategories,
  garden
);

const {
  handlePlantClick,
  handlePlantDragStart,
  handlePlantDragEnd,
  handlePlantHover,
} = usePlantInteractions(garden, gardenId, updatePlant);

// Load garden data and plants
const loadGarden = async () => {
  try {
    pending.value = true;
    error.value = null;

    // Load garden data
    const gardenData = await fetchGardenById(gardenId);

    if (!gardenData) {
      error.value = "Garden not found";
      return;
    }

    garden.value = gardenData;

    // Load the garden's background image
    if (gardenData.background_image_url) {
      loadBackgroundImage(gardenData.background_image_url, gardenData);
    }

    // Update stage config with garden dimensions if available
    if (gardenData.image_width && gardenData.image_height) {
      stageConfig.width = gardenData.image_width;
      stageConfig.height = gardenData.image_height;
      backgroundConfig.width = gardenData.image_width;
      backgroundConfig.height = gardenData.image_height;
    }

    // Load plants for this garden
    await loadPlants();
  } catch (err) {
    console.error("Error loading garden:", err);
    error.value = "Failed to load garden data";
  } finally {
    pending.value = false;
  }
};

// Load plants
const loadPlants = async () => {
  try {
    plants.value = await fetchPlants(gardenId);
    
    // Appliquer le resetZoom après que tout soit chargé
    await nextTick();
    setTimeout(() => {
      resetZoom();
    }, 200);
  } catch (err) {
    console.error("Error loading plants:", err);
    // Don't show error for plants, just continue without them
  }
};

// Setup resize listener
onMounted(() => {
  loadGarden();

  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
});
</script>

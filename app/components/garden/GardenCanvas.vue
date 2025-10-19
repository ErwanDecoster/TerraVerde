<template>
  <v-stage
    ref="stage"
    :config="stageConfig"
    @wheel="handleWheel"
    @click="handleBackgroundClick"
  >
    <v-layer ref="layer">
      <!-- Image de fond -->
      <v-image
        v-if="background"
        :config="backgroundConfig"
        name="background"
      />

      <v-group
        v-for="marker in plantMarkers"
        :key="marker.id"
        :config="{
          x: marker.config.x,
          y: marker.config.y,
          draggable: true,
        }"
        @click="() => handlePlantClick(marker)"
        @dragstart="() => handlePlantDragStart(marker)"
        @dragend="(event: any) => handlePlantDragEnd(marker, event)"
        @mouseenter="() => handlePlantHover(marker, true)"
        @mouseleave="() => handlePlantHover(marker, false)"
      >
        <!-- Plant Circle -->
        <v-circle
          :config="{
            x: 0,
            y: 0,
            radius: marker.config.radius,
            fill: marker.config.fill,
            stroke: marker.config.stroke,
            strokeWidth: marker.config.strokeWidth,
            opacity: marker.config.opacity,
          }"
        />
        <!-- Plant Category Label -->
        <v-text
          :config="{
            text: getCategoryLetter(marker.plant.category),
            fontSize: Math.max(10, Math.min(marker.config.radius / 2, 16)),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            fill: '#000000',
            align: 'center',
            verticalAlign: 'middle',
            width: marker.config.radius * 2,
            height: marker.config.radius * 2,
            offsetX: marker.config.radius,
            offsetY: marker.config.radius,
          }"
        />
      </v-group>
    </v-layer>
  </v-stage>
</template>

<script setup lang="ts">
interface Props {
  stageConfig: any
  background: HTMLImageElement | null
  backgroundConfig: any
  plantMarkers: any[]
  handleWheel: (e: any) => void
  handlePlantClick: (marker: any) => void
  handlePlantDragStart: (marker: any) => void
  handlePlantDragEnd: (marker: any, event: any) => void
  handlePlantHover: (marker: any, isHovering: boolean) => void
  getCategoryLetter: (category: string) => string
  handleBackgroundClick?: (e: any) => void
}

defineProps<Props>()

// Exposer les refs pour le parent
const stage = ref(null)
const layer = ref(null)

defineExpose({
  stage,
  layer,
})
</script>

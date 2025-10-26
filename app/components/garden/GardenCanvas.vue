<template>
  <v-stage
    ref="stage"
    :config="stageConfig"
    @wheel="handleWheel"
    @click="handleBackgroundClick"
  >
    <v-layer ref="layer">
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
          draggable: isEditingEnabled,
        }"
        @click="() => handlePlantClick(marker)"
        @dragstart="() => handlePlantDragStart(marker)"
        @dragend="(event: any) => handlePlantDragEnd(marker, event)"
        @mouseenter="() => handlePlantHover(marker, true)"
        @mouseleave="() => handlePlantHover(marker, false)"
      >
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
        <v-text
          :config="{
            text: getCategoryLetter(marker.plant.variety.category),
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
import type { PlantData } from '~/types/plant'

interface StageConfig {
  width: number
  height: number
  draggable: boolean
  scaleX: number
  scaleY: number
}

interface BackgroundConfig {
  x: number
  y: number
  image: HTMLImageElement | null
  width: number
  height: number
}

export interface PlantMarker {
  id: string
  plant: PlantData
  config: {
    x: number
    y: number
    radius: number
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
    [key: string]: unknown
  }
}

interface Props {
  stageConfig: StageConfig
  background: HTMLImageElement | null
  backgroundConfig: BackgroundConfig
  plantMarkers: PlantMarker[]
  isEditingEnabled: boolean
  handleWheel: (e: Event) => void
  handlePlantClick: (marker: PlantMarker) => void
  handlePlantDragStart: (marker: PlantMarker) => void
  handlePlantDragEnd: (marker: PlantMarker, event: Event) => void
  handlePlantHover: (marker: PlantMarker, isHovering: boolean) => void
  getCategoryLetter: (category: string) => string
  handleBackgroundClick?: (e: Event) => void
}

defineProps<Props>()

const stage = ref(null)
const layer = ref(null)

defineExpose({
  stage,
  layer,
})
</script>

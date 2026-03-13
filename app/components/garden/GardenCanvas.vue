<template>
  <v-stage
    ref="stage"
    :config="stageConfig"
    @wheel="handleWheel"
    @click="handleBackgroundClick"
  >
    <v-layer ref="layer">
      <v-image v-if="background" :config="backgroundConfig" name="background" />

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
        @dragend="(event) => handlePlantDragEnd(marker, event)"
        @mouseenter="() => handlePlantHoverEnter(marker)"
        @mouseleave="handlePlantHoverLeave"
      >
        <v-circle
          :config="{
            x: 0,
            y: 0,
            radius: marker.config.radius,
            fill: marker.config.fill,
            stroke: selectedPlantIds.includes(marker.id)
              ? '#fff'
              : marker.config.stroke,
            strokeWidth: selectedPlantIds.includes(marker.id)
              ? Math.max(3, marker.config.strokeWidth)
              : marker.config.strokeWidth,
            opacity: selectedPlantIds.includes(marker.id)
              ? 1
              : marker.config.opacity,
          }"
        />
        <v-text
          v-if="marker.showLetter"
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
import type { PlantData } from "~/types/plant";

interface StageConfig {
  width: number;
  height: number;
  draggable: boolean;
  scaleX: number;
  scaleY: number;
}

interface BackgroundConfig {
  x: number;
  y: number;
  image: HTMLImageElement | null;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

export interface PlantMarker {
  id: string;
  plant: PlantData;
  showLetter: boolean;
  config: {
    x: number;
    y: number;
    radius: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    [key: string]: unknown;
  };
}

interface KonvaStageLike {
  getPointerPosition: () => { x: number; y: number } | null;
  x: () => number;
  y: () => number;
  scaleX: () => number;
  scaleY: () => number;
  width: () => number;
  height: () => number;
  scale: (scale: { x: number; y: number }) => void;
  position: (pos: { x: number; y: number }) => void;
  batchDraw: () => void;
}

export interface KonvaNodeEventLike {
  target: {
    getStage: () => KonvaStageLike;
    x: () => number;
    y: () => number;
    scaleX: () => number;
    scaleY: () => number;
    getPointerPosition: () => { x: number; y: number } | null;
    attrs?: {
      name?: string;
    };
  };
}

interface KonvaWheelEventLike {
  evt: WheelEvent;
  target: {
    getStage: () => KonvaStageLike;
  };
}

interface Props {
  stageConfig: StageConfig;
  background: HTMLImageElement | null;
  backgroundConfig: BackgroundConfig;
  plantMarkers: PlantMarker[];
  isEditingEnabled: boolean;
  handleWheel: (e: KonvaWheelEventLike) => void;
  handlePlantClick: (marker: PlantMarker) => void;
  handlePlantDragStart: (marker: PlantMarker) => void;
  handlePlantDragEnd: (marker: PlantMarker, event: KonvaNodeEventLike) => void;
  handlePlantHoverEnter: (marker: PlantMarker) => void;
  handlePlantHoverLeave: () => void;
  getCategoryLetter: (category: string) => string;
  handleBackgroundClick: (e: KonvaNodeEventLike) => void;
  selectedPlantIds?: string[];
}

withDefaults(defineProps<Props>(), {
  selectedPlantIds: () => [],
});

const stage = ref(null);
const layer = ref(null);

defineExpose({
  stage,
  layer,
});
</script>

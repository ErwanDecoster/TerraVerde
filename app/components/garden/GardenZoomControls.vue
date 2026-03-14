<template>
  <div
    class="bg-default/75 border-default absolute top-2 right-2 z-10 flex items-center gap-2 rounded-xl border p-2 backdrop-blur"
  >
    <UButton
      icon="i-heroicons-minus-20-solid"
      size="sm"
      variant="outline"
      @click="zoomOut"
    />
    <span class="min-w-12 text-center text-sm">
      {{ Math.round(stageConfig.zoomPercent ?? stageConfig.scaleX * 100) }}%
    </span>
    <UButton
      icon="i-heroicons-plus-20-solid"
      size="sm"
      variant="outline"
      @click="zoomIn"
    />
    <UButton
      icon="i-heroicons-arrows-pointing-out-20-solid"
      size="sm"
      variant="outline"
      title="Reset zoom"
      @click="resetZoom"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  stageConfig: {
    scaleX: number;
    scaleY: number;
    zoomPercent?: number;
    width: number;
    height: number;
    draggable: boolean;
  };
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

defineProps<Props>();
</script>

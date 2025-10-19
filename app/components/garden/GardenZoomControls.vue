<template>
  <div
    class="absolute top-2 right-2 flex rounded-xl z-10 p-2 items-center gap-2 bg-default/75 backdrop-blur border border-default"
  >
    <UButton
      icon="i-heroicons-minus-20-solid"
      size="sm"
      color="neutral"
      variant="outline"
      @click="zoomOut"
    />
    <span class="text-sm min-w-12 text-center">
      {{ Math.round(stageConfig.scaleX * 100) }}%
    </span>
    <UButton
      icon="i-heroicons-plus-20-solid"
      size="sm"
      color="neutral"
      variant="outline"
      @click="zoomIn"
    />
    <UButton
      icon="i-heroicons-arrows-pointing-out-20-solid"
      size="sm"
      color="neutral"
      variant="outline"
      title="Reset zoom"
      @click="resetZoom"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  stageConfig: {
    scaleX: number
    scaleY: number
    width: number
    height: number
    draggable: boolean
  }
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

defineProps<Props>()
</script>

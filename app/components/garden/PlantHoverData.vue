<template>
  <div class="absolute bottom-2 left-2 z-10 rounded-xl p-2 flex items-center gap-2 bg-default/75 backdrop-blur border border-default">
    <UKbd
      size="sm"
    >
      {{ getCategoryInfo(plant.category)?.key }}
    </UKbd>
    <span class="text-xs font-medium">{{ plant.name }}</span>
  </div>
</template>

<script setup lang="ts">
import type { PlantData } from '~/types/plant'
import { getCategoryInfo } from '~/utils/plantCategories'

interface Props {
  plant: PlantData
}

defineProps<Props>()
</script>

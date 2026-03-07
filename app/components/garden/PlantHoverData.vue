<template>
  <div
    class="bg-default/75 border-default absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-xl border p-2 backdrop-blur"
  >
    <UKbd size="sm">
      {{ getCategoryInfo(plant.variety.category)?.key }}
    </UKbd>
    <span class="text-xs font-medium"
      >{{ plant.name }} | {{ plant.variety.name }}</span
    >
  </div>
</template>

<script setup lang="ts">
import type { PlantData } from "~/types/plant";
import { getCategoryInfo } from "~/utils/plantCategories";

interface Props {
  plant: PlantData;
}

defineProps<Props>();
</script>

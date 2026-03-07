<template>
  <UModal
    v-model:open="isOpen"
    title="Plant Information"
    :description="`Details for ${plant.name}`"
  >
    <UButton
      label="View Plant"
      variant="subtle"
      icon="i-heroicons-eye-20-solid"
    />

    <template #body>
      <div class="space-y-4">
        <div>
          <h4>
            {{ plant.name }}
          </h4>
          <p v-if="plant.description" class="text-muted text-sm">
            {{ plant.description }}
          </p>
        </div>

        <div class="bg-elevated rounded-lg p-4">
          <h5 class="font-medium">Variety</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="font-medium">Name:</span>
              <span class="text-muted ml-2">{{ plant.variety.name }}</span>
            </div>
            <div v-if="plant.variety.scientific_name">
              <span class="font-medium">Scientific Name:</span>
              <span class="text-muted ml-2 italic">{{
                plant.variety.scientific_name
              }}</span>
            </div>
            <div v-if="plant.variety.category">
              <span class="font-medium">Category:</span>
              <span class="text-muted ml-2">{{
                getCategoryLabel(plant.variety.category)
              }}</span>
            </div>
            <div v-if="plant.variety.main_color">
              <span class="font-medium">Color:</span>
              <div class="ml-2 inline-flex items-center">
                <div
                  class="mr-2 h-4 w-4 rounded-full border border-gray-300"
                  :style="{ backgroundColor: plant.variety.main_color }"
                />
                <span class="text-muted">{{ plant.variety.main_color }}</span>
              </div>
            </div>
            <div v-if="plant.variety.harvest_period">
              <span class="font-medium">Harvest Period:</span>
              <span class="text-muted ml-2">{{
                plant.variety.harvest_period
              }}</span>
            </div>
          </div>
          <div v-if="plant.variety.reference_url" class="mt-3">
            <UButton
              :to="plant.variety.reference_url"
              external
              target="_blank"
              color="primary"
              variant="outline"
              size="xs"
              icon="i-heroicons-arrow-top-right-on-square-20-solid"
            >
              Reference Link
            </UButton>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Status:</span>
            <UBadge
              :color="getStatusColor(plant.status)"
              variant="subtle"
              class="ml-2"
            >
              {{ getStatusLabel(plant.status) }}
            </UBadge>
          </div>
          <div>
            <span class="font-medium">Planted Date:</span>
            <span class="text-muted ml-2">{{
              formatDate(plant.planted_date)
            }}</span>
          </div>
          <div v-if="plant.height">
            <span class="font-medium">Height:</span>
            <span class="text-muted ml-2">{{ plant.height }}m</span>
          </div>
          <div v-if="plant.width">
            <span class="font-medium">Width:</span>
            <span class="text-muted ml-2">{{ plant.width }}m</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-0.5">
        <UButton variant="ghost" @click="close"> Close </UButton>
        <UButton
          v-if="canEdit"
          color="primary"
          icon="i-heroicons-pencil-square-20-solid"
          @click="openEditModal"
        >
          Edit Plant
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { PlantData } from "~/types/plant";
import { PLANT_STATUSES } from "~/types/plant";
import { getCategoryLabel } from "~/utils/plantCategories";

interface Props {
  plant: PlantData;
  open: boolean;
  canEdit?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "edit-requested", plant: PlantData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const getStatusLabel = (status: string) => {
  const statusInfo = PLANT_STATUSES.find((s) => s.value === status);
  return statusInfo?.label || status;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "planted":
      return "success";
    case "growing":
      return "primary";
    case "flowering":
      return "warning";
    case "fruiting":
      return "warning";
    case "harvested":
      return "success";
    case "dormant":
      return "neutral";
    case "dead":
      return "error";
    default:
      return "neutral";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const openEditModal = () => {
  emit("edit-requested", props.plant);
  isOpen.value = false;
};
</script>

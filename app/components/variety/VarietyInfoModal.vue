<template>
  <UModal
    v-model:open="isOpen"
    title="Variety Information"
    :description="`Details for ${variety.name}`"
  >
    <template #body>
      <div class="space-y-4">
        <div>
          <h4>{{ variety.name }}</h4>
          <p v-if="variety.scientific_name" class="text-muted text-sm italic">
            {{ variety.scientific_name }}
          </p>
        </div>

        <div class="bg-elevated rounded-lg p-4">
          <h5 class="mb-2 font-medium">Details</h5>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="font-medium">Category:</span>
              <span class="text-muted ml-2">
                {{ getCategoryLabel(variety.category) }}
              </span>
            </div>

            <div v-if="variety.harvest_period">
              <span class="font-medium">Harvest Period:</span>
              <span class="text-muted ml-2">{{ variety.harvest_period }}</span>
            </div>

            <div v-if="variety.main_color">
              <span class="font-medium">Main Color:</span>
              <div class="ml-2 inline-flex items-center">
                <div
                  class="mr-2 h-4 w-4 rounded-full border border-gray-300"
                  :style="{ backgroundColor: variety.main_color }"
                />
                <span class="text-muted">{{ variety.main_color }}</span>
              </div>
            </div>

            <div>
              <span class="font-medium">Visibility:</span>
              <span class="text-muted ml-2">
                {{ variety.is_public ? "Public" : "Private" }}
              </span>
            </div>
          </div>

          <div v-if="variety.reference_url" class="mt-3">
            <UButton
              :to="variety.reference_url"
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
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-0.5">
        <UButton
          v-if="canSearchPlants"
          color="primary"
          variant="outline"
          icon="i-heroicons-funnel-20-solid"
          @click="requestSearchPlants"
        >
          Find Plants
        </UButton>
        <UButton variant="ghost" @click="close">Close</UButton>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { VarietyData } from "~/types/variety";
import { getCategoryLabel } from "~/utils/plantCategories";

interface Props {
  variety: VarietyData;
  open: boolean;
  canSearchPlants?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "search-plants-requested", variety: VarietyData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const requestSearchPlants = () => {
  emit("search-plants-requested", props.variety);
};
</script>

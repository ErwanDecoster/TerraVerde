<script lang="ts" setup>
import AddGardenModal from "~/components/garden/AddGardenModal.vue";
import EditGardenModal from "~/components/garden/EditGardenModal.vue";
import { useGarden } from "~/composables/data/useGarden";
import type { GardenData } from "~/types/garden";

definePageMeta({
  middleware: ["auth"],
});

function handleGardenAdded(data: GardenData) {
  gardens.value.unshift(data);
}

function handleGardenUpdated(updatedGarden: GardenData) {
  const index = gardens.value.findIndex(
    (garden) => garden.id === updatedGarden.id,
  );
  if (index !== -1) {
    gardens.value[index] = updatedGarden;
  }
}

function handleGardenDeleted(gardenId: string) {
  const index = gardens.value.findIndex((garden) => garden.id === gardenId);
  if (index !== -1) {
    gardens.value.splice(index, 1);
  }
}

const gardens = ref<GardenData[]>([]);
const { fetchMyGardens } = useGarden();

onMounted(async () => {
  gardens.value = await fetchMyGardens();
});
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="mb-2 text-4xl font-bold">My Gardens</h1>
      <AddGardenModal @garden-added="handleGardenAdded" />
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="garden in gardens"
        :key="garden.id"
        class="overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      >
        <template #header>
          <div class="relative aspect-video overflow-hidden">
            <img
              :src="garden.background_image_url"
              :alt="garden.name + ' background image'"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div class="absolute top-2 right-2">
              <UBadge color="primary" variant="solid" size="xs">
                Public
              </UBadge>
            </div>
          </div>
        </template>

        <div class="space-y-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ garden.name }}
          </h3>

          <div class="flex justify-end gap-2">
            <EditGardenModal
              :garden="garden"
              @garden-updated="handleGardenUpdated"
              @garden-deleted="handleGardenDeleted"
            />
            <UButton
              :to="`/garden/${garden.id}`"
              color="primary"
              icon="i-heroicons-eye-20-solid"
            >
              View
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

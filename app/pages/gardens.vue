<script lang="ts" setup>
import { storeToRefs } from "pinia";
import AddGardenModal from "~/components/garden/AddGardenModal.vue";
import EditGardenModal from "~/components/garden/EditGardenModal.vue";
import type { GardenData } from "~/types/garden";

definePageMeta({
  middleware: ["auth"],
});

const gardensStore = useGardensStore();
const { myGardens: gardens } = storeToRefs(gardensStore);

function handleGardenAdded(data: GardenData) {
  gardensStore.upsertMyGarden(data);
  gardensStore.syncPublicGarden(data);
}

function handleGardenUpdated(updatedGarden: GardenData) {
  gardensStore.upsertMyGarden(updatedGarden);
  gardensStore.syncPublicGarden(updatedGarden);
}

function handleGardenDeleted(gardenId: string) {
  gardensStore.removeMyGarden(gardenId);
  gardensStore.removePublicGarden(gardenId);
}

onMounted(async () => {
  await gardensStore.loadMyGardens();
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
              :alt="garden.name + ' background'"
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

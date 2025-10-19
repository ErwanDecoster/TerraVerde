<script lang="ts" setup>
import AddGardenModal from '~/components/garden/AddGardenModal.vue'
import EditGardenModal from '~/components/garden/EditGardenModal.vue'
import { useGarden } from '~/composables/data/useGarden'
import type { GardenData } from '~/types/garden'

definePageMeta({
  middleware: ['auth'],
})

function handleGardenAdded(data: GardenData) {
  console.log('New garden added:', data)
  gardens.value.unshift(data)
}

function handleGardenUpdated(updatedGarden: GardenData) {
  console.log('Garden updated:', updatedGarden)
  const index = gardens.value.findIndex(
    garden => garden.id === updatedGarden.id,
  )
  if (index !== -1) {
    gardens.value[index] = updatedGarden
  }
}

function handleGardenDeleted(gardenId: string) {
  console.log('Garden deleted:', gardenId)
  const index = gardens.value.findIndex(garden => garden.id === gardenId)
  if (index !== -1) {
    gardens.value.splice(index, 1)
  }
}

const gardens = ref<GardenData[]>([])
const { fetchGardens } = useGarden()

onMounted(async () => {
  gardens.value = await fetchGardens()
})
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">
        Garden Management
      </h1>
      <AddGardenModal @garden-added="handleGardenAdded" />
    </div>

    <!-- Your map management content here -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="garden in gardens"
        :key="garden.name"
        variant="subtle"
      >
        <template #header>
          <h2 class="text-lg font-semibold">
            {{ garden.name }}
          </h2>
        </template>

        <img
          :src="garden.background_image_url"
          alt="Garden Image"
          class="w-full h-48 object-cover rounded"
        >

        <template #footer>
          <div class="flex justify-end gap-2">
            <EditGardenModal
              :garden="garden"
              @garden-updated="handleGardenUpdated"
              @garden-deleted="handleGardenDeleted"
            />
            <UButton :to="`/gardens/${garden.id}`">
              View
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

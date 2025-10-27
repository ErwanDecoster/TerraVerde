<template>
  <div class="absolute top-2 left-2 z-10 grid gap-2">
    <div
      class="rounded-xl p-2 grid gap-1 bg-default/75 backdrop-blur border border-default"
    >
      <UButton
        variant="subtle"
        @click="navigateTo(`/gardens`)"
      >
        Back to Gardens
      </UButton>
    </div>

    <div
      class="rounded-xl p-2 grid gap-2 bg-default/75 backdrop-blur border border-default"
    >
      <h1 class="text-xl font-semibold">
        {{ garden?.name }}
      </h1>
      <div
        v-if="garden?.is_public && !isOwner"
        class="flex items-center gap-2 text-sm text-muted"
      >
        <UIcon
          name="i-heroicons-globe-alt-20-solid"
          class="w-4 h-4 text-blue-500"
        />
        <span>Public Garden</span>
      </div>
      <USeparator />
      <div class="grid grid-cols-2 gap-2">
        <div class="flex items-center gap-2 justify-center">
          <UIcon
            name="i-heroicons-sparkles-20-solid"
            class="w-4 h-4 text-green-500"
          />
          <span class="text-sm">{{ plantsCount }} plants</span>
        </div>
        <div class="flex items-center gap-2 justify-center">
          <UIcon
            name="i-heroicons-squares-2x2-20-solid"
            class="w-4 h-4 text-blue-500"
          />
          <span class="text-sm">{{ varietiesCount }} varieties</span>
        </div>
        <UButton
          :to="`/garden/${garden?.id}/plants`"
          variant="outline"
          class="justify-center"
        >
          {{ isOwner ? "Manage Plants" : "View Plants" }}
        </UButton>
        <UButton
          :to="`/garden/${garden?.id}/varieties`"
          variant="outline"
          class="justify-center"
        >
          {{ isOwner ? "Manage Varieties" : "View Varieties" }}
        </UButton>
      </div>
      <EditGardenModal
        v-if="garden && isOwner"
        :garden="garden"
        @garden-updated="$emit('garden-updated')"
      />
      <USwitch
        v-if="isOwner"
        :label="
          isEditingEnabled ? 'Switch to View Mode' : 'Switch to Edit Mode'
        "
        :model-value="isEditingEnabled"
        @update:model-value="handleEditingToggle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenData } from '~/types/garden'
import type { PlantData } from '~/types/plant'
import EditGardenModal from './EditGardenModal.vue'

interface Props {
  garden?: GardenData | null
  plants: PlantData[]
  isEditingEnabled?: boolean
  isOwner?: boolean
}

interface Emits {
  (e: 'garden-updated'): void
  (e: 'update:editing-enabled', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const plantsCount = computed(() => props.plants.length)

const varietiesCount = computed(() => {
  const uniqueVarietyIds = new Set(
    props.plants
      .filter(plant => plant.variety_id)
      .map(plant => plant.variety_id),
  )
  return uniqueVarietyIds.size
})

const handleEditingToggle = (value: string | boolean) => {
  emit('update:editing-enabled', Boolean(value))
}
</script>

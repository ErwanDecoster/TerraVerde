<template>
  <div class="absolute top-2 left-2 z-10 grid gap-2">
    <div
      class="rounded-xl p-2 grid gap-1 bg-default/75 backdrop-blur border border-default"
    >
      <UButton
        color="neutral"
        variant="subtle"
        @click="$emit('back')"
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
      <USeparator />
      <div class="flex items-center justify-center gap-2">
        <UIcon
          name="i-heroicons-sparkles-20-solid"
          class="w-4 h-4 text-green-500"
        />
        <span>{{ plantsCount }} plants</span>
      </div>
      <EditGardenModal
        v-if="garden"
        :garden="garden"
        @garden-updated="$emit('garden-updated')"
      />
      <USwitch
        label="Map editing"
        :model-value="isEditingEnabled"
        @update:model-value="handleEditingToggle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenData } from '~/types/garden'
import EditGardenModal from './EditGardenModal.vue'

interface Props {
  garden?: GardenData | null
  plantsCount: number
  isEditingEnabled?: boolean
}

interface Emits {
  (e: 'back' | 'garden-updated'): void
  (e: 'update:editing-enabled', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Handle editing mode toggle
const handleEditingToggle = (value: string | boolean) => {
  emit('update:editing-enabled', Boolean(value))
}
</script>

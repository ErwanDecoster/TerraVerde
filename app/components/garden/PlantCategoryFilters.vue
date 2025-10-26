<template>
  <div
    class="absolute bottom-2 right-2 rounded-xl z-10 p-3 bg-default/75 backdrop-blur border border-default"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs font-medium">
        Plant Categories
      </div>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        @click="toggleAllCategories"
      >
        {{
          visibleCategories.length === plantCategories.length ? "None" : "All"
        }}
      </UButton>
    </div>
    <ul class="grid grid-cols-2 gap-1 text-xs">
      <li
        v-for="category in plantCategories"
        :key="category.key"
        class="flex items-center gap-1"
      >
        <label
          :for="`category-${category.value}`"
          class="flex items-center gap-1 cursor-pointer"
        >
          <UCheckbox
            :id="`category-${category.value}`"
            :model-value="visibleCategories.includes(category.value)"
            size="xs"
            @update:model-value="() => toggleCategory(category.value)"
          />
          <UKbd size="sm">
            {{ category.key }}
          </UKbd>
          <span>{{ category.label }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { plantCategories } from '~/utils/plantCategories'

interface Props {
  visibleCategories: string[]
}

interface Emits {
  (e: 'update:visibleCategories', categories: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visibleCategories = computed({
  get: () => props.visibleCategories,
  set: (value: string[]) => emit('update:visibleCategories', value),
})

const toggleCategory = (categoryValue: string) => {
  const currentCategories = [...visibleCategories.value]
  const index = currentCategories.indexOf(categoryValue)

  if (index > -1) {
    currentCategories.splice(index, 1)
  }
  else {
    currentCategories.push(categoryValue)
  }

  emit('update:visibleCategories', currentCategories)
}

const toggleAllCategories = () => {
  if (visibleCategories.value.length === plantCategories.length) {
    emit('update:visibleCategories', [])
  }
  else {
    emit(
      'update:visibleCategories',
      plantCategories.map(cat => cat.value),
    )
  }
}
</script>

<template>
  <div
    class="bg-default/75 border-default absolute right-2 bottom-2 z-10 rounded-xl border p-3 backdrop-blur"
  >
    <div class="mb-2 flex items-center justify-between">
      <div class="text-xs font-medium">Plant Categories</div>
      <UButton size="xs" variant="ghost" @click="toggleAllCategories">
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
          class="flex cursor-pointer items-center gap-1"
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
import { plantCategories } from "~/utils/plantCategories";

interface Props {
  visibleCategories: string[];
}

interface Emits {
  (e: "update:visibleCategories", categories: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleCategories = computed({
  get: () => props.visibleCategories,
  set: (value: string[]) => emit("update:visibleCategories", value),
});

const toggleCategory = (categoryValue: string) => {
  const currentCategories = [...visibleCategories.value];
  const index = currentCategories.indexOf(categoryValue);

  if (index > -1) {
    currentCategories.splice(index, 1);
  } else {
    currentCategories.push(categoryValue);
  }

  emit("update:visibleCategories", currentCategories);
};

const toggleAllCategories = () => {
  if (visibleCategories.value.length === plantCategories.length) {
    emit("update:visibleCategories", []);
  } else {
    emit(
      "update:visibleCategories",
      plantCategories.map((cat) => cat.value),
    );
  }
};
</script>

<template>
  <div class="absolute top-2 left-2 z-10 grid gap-2">
    <div
      class="bg-default/75 border-default grid gap-1 rounded-xl border p-2 backdrop-blur"
    >
      <UButton variant="subtle" @click="navigateTo(`/gardens`)">
        Back to Gardens
      </UButton>
    </div>

    <div
      class="bg-default/75 border-default grid gap-2 rounded-xl border p-2 backdrop-blur"
    >
      <h1 class="text-xl font-semibold">
        {{ garden?.name }}
      </h1>
      <div
        v-if="garden?.is_public"
        class="text-muted flex items-center gap-2 text-sm"
      >
        <UIcon
          name="i-heroicons-globe-alt-20-solid"
          class="h-4 w-4 text-blue-500"
        />
        <span>Public Garden</span>
      </div>
      <USeparator />
      <div class="grid grid-cols-2 gap-2">
        <div class="flex items-center justify-center gap-2">
          <UIcon
            name="i-heroicons-sparkles-20-solid"
            class="h-4 w-4 text-green-500"
          />
          <span class="text-sm">{{ plantsCount }} plants</span>
        </div>
        <div class="flex items-center justify-center gap-2">
          <UIcon
            name="i-heroicons-squares-2x2-20-solid"
            class="h-4 w-4 text-blue-500"
          />
          <span class="text-sm">{{ varietiesCount }} varieties</span>
        </div>
        <UButton
          :to="`/garden/${garden?.id}/plants`"
          variant="outline"
          class="justify-center"
        >
          {{ canEditPlants ? "Manage Plants" : "View Plants" }}
        </UButton>
        <UButton
          :to="`/garden/${garden?.id}/varieties`"
          variant="outline"
          class="justify-center"
        >
          {{ canEditVarieties ? "Manage Varieties" : "View Varieties" }}
        </UButton>
      </div>
      <EditGardenModal
        v-if="garden && canEditGardens"
        :garden="garden"
        @garden-updated="$emit('garden-updated')"
        @background-rotation-preview="
          $emit('background-rotation-preview', $event)
        "
        @background-offset-preview="$emit('background-offset-preview', $event)"
        @pixels-per-meters-preview="$emit('pixels-per-meters-preview', $event)"
        @default-zoom-preview="$emit('default-zoom-preview', $event)"
        @default-center-preview="$emit('default-center-preview', $event)"
      />
      <ManageTeamsModal
        v-if="garden && canManageTeams"
        :garden="garden"
        :current-role="currentRole"
      />
      <USwitch
        v-if="canToggleEdit"
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
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import EditGardenModal from "./EditGardenModal.vue";
import ManageTeamsModal from "./ManageTeamsModal.vue";

interface Props {
  garden?: GardenData | null;
  plants: PlantData[];
  isEditingEnabled?: boolean;
  currentRole?: "owner" | "admin" | "editor" | "viewer" | null;
}

interface Emits {
  (e: "garden-updated"): void;
  (
    e: "background-rotation-preview" | "pixels-per-meters-preview",
    value: number,
  ): void;
  (e: "default-zoom-preview", value: number | null): void;
  (
    e: "default-center-preview",
    payload: { x: number | null; y: number | null },
  ): void;
  (e: "background-offset-preview", payload: { x: number; y: number }): void;
  (e: "update:editing-enabled", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const plantsCount = computed(() => props.plants.length);

const varietiesCount = computed(() => {
  const uniqueVarietyIds = new Set(
    props.plants
      .filter((plant) => plant.variety_id)
      .map((plant) => plant.variety_id),
  );
  return uniqueVarietyIds.size;
});

const canEditGardens = computed(() =>
  ["owner"].includes(props.currentRole || "viewer"),
);
const canManageTeams = computed(() =>
  ["owner", "admin"].includes(props.currentRole || "viewer"),
);
const canEditPlants = computed(() =>
  ["owner", "admin", "editor"].includes(props.currentRole || "viewer"),
);
const canEditVarieties = canEditPlants;
const canToggleEdit = computed(() =>
  ["owner", "admin", "editor"].includes(props.currentRole || "viewer"),
);

const handleEditingToggle = (value: string | boolean) => {
  emit("update:editing-enabled", Boolean(value));
};
</script>

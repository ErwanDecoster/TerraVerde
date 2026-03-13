<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { usePlant } from "~/composables/data/usePlant";
import { useVariety } from "~/composables/data/useVariety";
import type { VarietyFilterMode } from "~/types/garden";
import type {
  PlantBulkHistoryFormData,
  PlantBulkUpdateFormData,
  PlantData,
  PlantEventType,
} from "~/types/plant";
import { PLANT_EVENT_TYPES } from "~/types/plant";
import type { VarietyData } from "~/types/variety";

interface Props {
  open: boolean;
  plants: PlantData[];
  gardenId: string;
  varietyFilterMode?: VarietyFilterMode;
  canBulkEdit: boolean;
  canBulkAddHistory: boolean;
  mode: "standard" | "edit";
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "bulk-updated", plants: PlantData[]): void;
  (e: "bulk-history-added", count: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { updatePlantsBulk, addPlantEventsBulk } = usePlant();
const { fetchVarieties } = useVariety();
const toast = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const schema = z.object({
  variety_id: z.string().optional(),
  planted_date: z.string().optional(),
  height: z
    .number()
    .min(0.1, "Height must be more than 0.1")
    .max(150, "Height cannot exceed 150 meters")
    .optional(),
  width: z
    .number()
    .min(0.1, "Width must be more than 0.1")
    .max(40, "Width cannot exceed 40 meters")
    .optional(),
  confirm_replacement: z.boolean().optional(),
  add_history: z.boolean().optional(),
  history_event_type: z
    .enum(["watering", "pruning", "fertilizing", "care", "other"])
    .optional(),
  history_event_date: z.string().optional(),
  history_title: z
    .string()
    .max(120, "Title cannot exceed 120 characters")
    .optional(),
  history_notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
});

export type BulkEditSchema = z.output<typeof schema>;

const state = reactive<Partial<BulkEditSchema>>({
  variety_id: "",
  planted_date: "",
  height: undefined,
  width: undefined,
  confirm_replacement: false,
  add_history: false,
  history_event_type: "watering",
  history_event_date: new Date().toISOString().slice(0, 16),
  history_title: "",
  history_notes: "",
});

const form = ref();
const loading = ref(false);

const varieties = ref<VarietyData[]>([]);
const varietiesLoading = ref(false);

const selectedIds = computed(() => props.plants.map((plant) => plant.id));
const selectedNamesPreview = computed(() =>
  props.plants.slice(0, 6).map((plant) => plant.name),
);

const fieldDiffs = computed(() => {
  if (props.plants.length < 2) return [] as string[];

  const diffs: string[] = [];
  const first = props.plants[0];
  if (!first) return diffs;

  if (props.plants.some((plant) => plant.variety_id !== first.variety_id)) {
    diffs.push("Variety");
  }
  if (props.plants.some((plant) => plant.planted_date !== first.planted_date)) {
    diffs.push("Planted Date");
  }
  if (props.plants.some((plant) => plant.height !== first.height)) {
    diffs.push("Height");
  }
  if (props.plants.some((plant) => plant.width !== first.width)) {
    diffs.push("Width");
  }

  return diffs;
});

const hasDiffs = computed(() => fieldDiffs.value.length > 0);

const hasPatchData = computed(() => {
  return Boolean(
    state.variety_id ||
    state.planted_date ||
    state.height !== undefined ||
    state.width !== undefined,
  );
});

const canApplyBulkEdit = computed(
  () => props.mode === "edit" && props.canBulkEdit,
);
const canApplyBulkHistory = computed(
  () => props.mode === "standard" && props.canBulkAddHistory,
);

const canSubmit = computed(() => {
  if (canApplyBulkEdit.value) {
    if (hasDiffs.value && hasPatchData.value && !state.confirm_replacement) {
      return false;
    }

    return hasPatchData.value;
  }

  if (canApplyBulkHistory.value) {
    const wantsHistory = Boolean(state.add_history);
    const hasHistoryPayload = Boolean(
      state.history_event_type && state.history_event_date,
    );

    if (!wantsHistory) {
      return false;
    }

    return hasHistoryPayload;
  }

  return false;
});

const varietyOptions = computed(() => {
  return varieties.value.map((variety) => ({
    label: variety.scientific_name
      ? `${variety.name} (${variety.scientific_name})`
      : variety.name,
    value: variety.id.toString(),
  }));
});

const eventTypeItems = computed(() => {
  return PLANT_EVENT_TYPES.filter(
    (eventType) => eventType.value !== "photo",
  ).map((eventType) => ({ label: eventType.label, value: eventType.value }));
});

const loadVarieties = async () => {
  if (!canApplyBulkEdit.value) return;
  if (varieties.value.length > 0) return;
  varietiesLoading.value = true;
  try {
    varieties.value = await fetchVarieties(
      props.gardenId,
      props.varietyFilterMode,
    );
  } catch (error) {
    console.error("Error loading varieties:", error);
    toast.add({
      title: "Error",
      description: "Failed to load varieties",
      color: "error",
    });
  } finally {
    varietiesLoading.value = false;
  }
};

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      loadVarieties();
    }
  },
);

const resetForm = () => {
  Object.assign(state, {
    variety_id: "",
    planted_date: "",
    height: undefined,
    width: undefined,
    confirm_replacement: false,
    add_history: false,
    history_event_type: "watering",
    history_event_date: new Date().toISOString().slice(0, 16),
    history_title: "",
    history_notes: "",
  });
};

const createPatchPayload = (): PlantBulkUpdateFormData => {
  const payload: PlantBulkUpdateFormData = {};

  if (state.variety_id) payload.variety_id = Number.parseInt(state.variety_id);
  if (state.planted_date) payload.planted_date = state.planted_date;
  if (state.height !== undefined) payload.height = state.height;
  if (state.width !== undefined) payload.width = state.width;

  return payload;
};

const createHistoryPayload = (): PlantBulkHistoryFormData | null => {
  if (
    !state.add_history ||
    !state.history_event_type ||
    !state.history_event_date
  ) {
    return null;
  }

  return {
    event_type: state.history_event_type as Exclude<PlantEventType, "photo">,
    event_date: state.history_event_date,
    title: state.history_title || "",
    notes: state.history_notes || "",
  };
};

async function onSubmit(_event: FormSubmitEvent<BulkEditSchema>) {
  loading.value = true;

  try {
    const patch = createPatchPayload();
    const historyPayload = createHistoryPayload();

    if (Object.keys(patch).length > 0 && canApplyBulkEdit.value) {
      const updatedPlants = await updatePlantsBulk(selectedIds.value, patch);
      emit("bulk-updated", updatedPlants);
    }

    if (historyPayload && canApplyBulkHistory.value) {
      const createdEvents = await addPlantEventsBulk(
        selectedIds.value,
        props.gardenId,
        historyPayload,
      );
      emit("bulk-history-added", createdEvents.length);
    }

    toast.add({
      title: "Bulk Changes Applied",
      description: `Applied to ${props.plants.length} plants`,
      color: "success",
    });

    isOpen.value = false;
    resetForm();
  } catch (error) {
    console.error("Error applying bulk changes:", error);
    toast.add({
      title: "Error",
      description: "Failed to apply bulk changes",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Bulk Edit Plants"
    :description="`${plants.length} plants selected`"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="canApplyBulkEdit && hasDiffs"
          color="warning"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle-20-solid"
          title="Different values detected"
          :description="`These fields currently differ: ${fieldDiffs.join(', ')}. New values will replace all selected plants.`"
        />

        <div class="rounded-md border p-3 text-sm">
          <p class="font-medium">Selected plants ({{ plants.length }})</p>
          <p class="text-muted mt-1">
            {{ selectedNamesPreview.join(", ") }}
            <span v-if="plants.length > selectedNamesPreview.length">
              +{{ plants.length - selectedNamesPreview.length }} more
            </span>
          </p>
        </div>

        <div v-if="canApplyBulkEdit" class="space-y-4">
          <UFormField
            label="Variety"
            name="variety_id"
            description="Optional bulk replacement"
          >
            <UInputMenu
              v-model="state.variety_id"
              :items="varietyOptions"
              :loading="varietiesLoading"
              :value-key="'value'"
              placeholder="Leave empty to keep current values"
              searchable
            />
          </UFormField>

          <UFormField
            label="Planted Date"
            name="planted_date"
            description="Optional bulk replacement"
          >
            <UInput v-model="state.planted_date" type="date" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Height (m)"
              name="height"
              description="Optional bulk replacement"
            >
              <UInput
                v-model.number="state.height"
                type="number"
                step="0.1"
                min="0.1"
                max="150"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Width (m)"
              name="width"
              description="Optional bulk replacement"
            >
              <UInput
                v-model.number="state.width"
                type="number"
                step="0.1"
                min="0.1"
                max="40"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            v-if="hasDiffs && hasPatchData"
            name="confirm_replacement"
            label="Confirm replacement"
            description="Required because selected plants currently have different values"
          >
            <UCheckbox
              v-model="state.confirm_replacement"
              label="I understand these values will replace all selected plants"
            />
          </UFormField>
        </div>

        <USeparator v-if="canApplyBulkHistory" />

        <div v-if="canApplyBulkHistory" class="space-y-3">
          <UCheckbox
            v-model="state.add_history"
            label="Add one history event to all selected plants"
          />

          <template v-if="state.add_history">
            <UFormField
              label="History Event Type"
              name="history_event_type"
              required
            >
              <USelect
                v-model="state.history_event_type"
                :items="eventTypeItems"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="History Event Date"
              name="history_event_date"
              required
            >
              <UInput
                v-model="state.history_event_date"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="History Title"
              name="history_title"
              description="Optional title"
            >
              <UInput
                v-model="state.history_title"
                class="w-full"
                placeholder="Optional event title"
              />
            </UFormField>

            <UFormField
              label="History Notes"
              name="history_notes"
              description="Optional details"
            >
              <UTextarea
                v-model="state.history_notes"
                class="w-full"
                :rows="3"
                placeholder="Optional event notes"
              />
            </UFormField>
          </template>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton variant="ghost" :disabled="loading" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton
          :loading="loading"
          :disabled="loading || !canSubmit"
          icon="i-heroicons-check-20-solid"
          @click="form.submit()"
        >
          Apply to {{ plants.length }} plants
        </UButton>
      </div>
    </template>
  </UModal>
</template>

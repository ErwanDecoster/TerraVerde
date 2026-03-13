<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { usePlant } from "~/composables/data/usePlant";
import type { PlantData, PlantEventData } from "~/types/plant";

interface Props {
  open: boolean;
  plant: PlantData;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "event-added", value: PlantEventData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { addPlantEvent } = usePlant();
const toast = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const schema = z.object({
  event_type: z.enum(["watering", "pruning", "fertilizing", "care", "other"], {
    message: "Event type is required",
  }),
  event_date: z.string().min(1, "Date is required"),
  title: z.string().max(120, "Title cannot exceed 120 characters").optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export type AddPlantEventSchema = z.output<typeof schema>;

const state = reactive<Partial<AddPlantEventSchema>>({
  event_type: "watering",
  event_date: new Date().toISOString().slice(0, 16),
  title: "",
  notes: "",
});

const loading = ref(false);
const form = ref();

const eventTypeItems = [
  { label: "Watering", value: "watering" },
  { label: "Pruning", value: "pruning" },
  { label: "Fertilizing", value: "fertilizing" },
  { label: "Care", value: "care" },
  { label: "Other", value: "other" },
];

const resetForm = () => {
  Object.assign(state, {
    event_type: "watering",
    event_date: new Date().toISOString().slice(0, 16),
    title: "",
    notes: "",
  });
};

const defaultTitleByType: Record<string, string> = {
  watering: "Watering",
  pruning: "Pruning",
  fertilizing: "Fertilizing",
  care: "Care",
  other: "Other",
};

async function onSubmit(event: FormSubmitEvent<AddPlantEventSchema>) {
  loading.value = true;

  try {
    const eventData = await addPlantEvent({
      plant_id: props.plant.id,
      garden_id: props.plant.garden_id || "",
      event_type: event.data.event_type,
      event_date: event.data.event_date,
      title: event.data.title || defaultTitleByType[event.data.event_type],
      notes: event.data.notes || "",
    });

    emit("event-added", eventData);
    isOpen.value = false;

    toast.add({
      title: "Event Added",
      description: "The event has been added to this plant history",
      color: "success",
    });

    resetForm();
  } catch (error) {
    console.error("Error adding plant event:", error);
    toast.add({
      title: "Error",
      description: "Failed to add event",
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
    title="Add Plant Event"
    :description="`Add a new event for ${plant.name}`"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Event Type" name="event_type" required>
          <USelect
            v-model="state.event_type"
            :items="eventTypeItems"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Date" name="event_date" required>
          <UInput
            v-model="state.event_date"
            type="datetime-local"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Title"
          name="title"
          description="Optional custom title"
        >
          <UInput
            v-model="state.title"
            class="w-full"
            placeholder="Optional event title"
          />
        </UFormField>

        <UFormField label="Notes" name="notes" description="Optional details">
          <UTextarea
            v-model="state.notes"
            class="w-full"
            :rows="4"
            placeholder="Add notes"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton variant="ghost" :disabled="loading" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton
          :loading="loading"
          icon="i-heroicons-plus-20-solid"
          @click="form.submit()"
        >
          Add Event
        </UButton>
      </div>
    </template>
  </UModal>
</template>

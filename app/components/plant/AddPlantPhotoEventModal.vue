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

const { addPlantPhotoEvent } = usePlant();
const toast = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const schema = z.object({
  event_date: z.string().min(1, "Date is required"),
  caption: z
    .string()
    .max(200, "Caption cannot exceed 200 characters")
    .optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  image: z
    .instanceof(File, { message: "Image is required" })
    .refine(
      (file) => !file || file.size <= 10 * 1024 * 1024,
      "File size must not exceed 10MB",
    )
    .refine(
      (file) =>
        !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Unsupported image format (JPEG, PNG, WebP only)",
    ),
});

export type AddPlantPhotoEventSchema = z.output<typeof schema>;

const state = reactive<Partial<AddPlantPhotoEventSchema>>({
  event_date: new Date().toISOString().slice(0, 16),
  caption: "",
  notes: "",
  image: undefined,
});

const loading = ref(false);
const form = ref();

const resetForm = () => {
  Object.assign(state, {
    event_date: new Date().toISOString().slice(0, 16),
    caption: "",
    notes: "",
    image: undefined,
  });
};

async function onSubmit(event: FormSubmitEvent<AddPlantPhotoEventSchema>) {
  loading.value = true;

  try {
    const eventData = await addPlantPhotoEvent({
      plant_id: props.plant.id,
      garden_id: props.plant.garden_id || "",
      event_date: event.data.event_date,
      caption: event.data.caption || "",
      notes: event.data.notes || "",
      file: event.data.image,
    });

    emit("event-added", eventData);
    isOpen.value = false;

    toast.add({
      title: "Photo Added",
      description: "The photo has been added to this plant history",
      color: "success",
    });

    resetForm();
  } catch (error) {
    console.error("Error adding plant photo event:", error);
    toast.add({
      title: "Error",
      description: "Failed to add photo",
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
    title="Add Plant Photo"
    :description="`Upload a photo for ${plant.name}`"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Photo"
          name="image"
          description="JPEG, PNG, WebP. Max 10MB"
          required
        >
          <UFileUpload
            v-model="state.image"
            accept="image/jpeg,image/png,image/webp"
            class="min-h-32"
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
          label="Caption"
          name="caption"
          description="Optional caption"
        >
          <UInput
            v-model="state.caption"
            class="w-full"
            placeholder="Optional caption"
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
          icon="i-heroicons-photo-20-solid"
          @click="form.submit()"
        >
          Add Photo
        </UButton>
      </div>
    </template>
  </UModal>
</template>

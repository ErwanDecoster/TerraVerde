<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { useGarden } from "~/composables/data/useGarden";
import { useAuth } from "~/composables/useAuth";
import type { GardenData } from "~/types/garden";
import BackgroundImageTransformModal from "./BackgroundImageTransformModal.vue";

interface Props {
  garden: GardenData;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "gardenUpdated", data: GardenData): void;
  (e: "gardenDeleted", gardenId: string): void;
  (
    e:
      | "backgroundRotationPreview"
      | "pixelsPerMetersPreview"
      | "defaultZoomPreview",
    value: number | null,
  ): void;
  (e: "backgroundOffsetPreview", payload: { x: number; y: number }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const open = ref(false);
const toast = useToast();
const { updateGarden, deleteGarden } = useGarden();
const { user } = useAuth();

const parseDefaultZoom = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const showDeleteConfirmation = ref(false);

const isGardenOwner = computed(() => {
  if (!user.value) return false;
  const teams = props.garden.teams || [];
  for (const team of teams) {
    if (team.teams_members?.length > 0) {
      return true;
    }
  }
  return false;
});

const canDeleteGarden = isGardenOwner;

const normalizeRotation = (rotation: number) => {
  if (!Number.isFinite(rotation)) return 0;
  return Math.max(0, Math.min(360, rotation));
};

const normalizeOffset = (offset: number) => {
  if (!Number.isFinite(offset)) return 0;
  return Math.max(-5000, Math.min(5000, offset));
};

const normalizePixelsPerMeters = (value: number) => {
  if (!Number.isFinite(value)) return 20;
  return Math.max(1, Math.min(100, value));
};

const normalizeDefaultZoomPercent = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(10, Math.min(1000, parsed));
};

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  isPublic: z.boolean().optional(),
  PixelsPerMeters: z
    .number()
    .min(1, "Scale must be at least 1 Pixels per Meters")
    .max(100, "Scale cannot exceed 100 Pixels per Meters"),
  defaultZoom: z
    .preprocess(
      (value) => parseDefaultZoom(value),
      z
        .number()
        .min(10, "Default zoom must be at least 10")
        .max(1000, "Default zoom cannot exceed 1000")
        .nullable(),
    )
    .optional(),
  variety_filter_mode: z.enum(["garden", "public", "all"], {
    message: "Variety filter mode is required",
  }),
  backgroundImage: z
    .instanceof(File, { message: "Map file is required" })
    .optional()
    .refine(
      (file) => !file || file.size <= 10 * 1024 * 1024,
      "File size must not exceed 10MB",
    )
    .refine(
      (file) =>
        !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Unsupported image format (JPEG, PNG, WebP only)",
    ),
  backgroundImageRotation: z
    .number()
    .min(0, "Rotation must be between 0 and 360 degrees")
    .max(360, "Rotation must be between 0 and 360 degrees"),
  backgroundImageOffsetX: z
    .number()
    .min(-5000, "Horizontal offset must be between -5000 and 5000 pixels")
    .max(5000, "Horizontal offset must be between -5000 and 5000 pixels"),
  backgroundImageOffsetY: z
    .number()
    .min(-5000, "Vertical offset must be between -5000 and 5000 pixels")
    .max(5000, "Vertical offset must be between -5000 and 5000 pixels"),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .nullable(),
  zip_code: z
    .string()
    .max(20, "Zip code cannot exceed 20 characters")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country cannot exceed 100 characters")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City cannot exceed 100 characters")
    .optional()
    .nullable(),
  street_address: z
    .string()
    .max(100, "Street address cannot exceed 100 characters")
    .optional()
    .nullable(),
});

export type EditGardenSchema = z.output<typeof schema>;

const state = reactive<Partial<EditGardenSchema>>({
  name: props.garden.name,
  isPublic: props.garden.is_public || false,
  PixelsPerMeters: props.garden.pixels_per_meters || 20,
  defaultZoom: parseDefaultZoom(props.garden.default_zoom),
  variety_filter_mode: props.garden.variety_filter_mode,
  backgroundImage: undefined,
  backgroundImageRotation: props.garden.background_image_rotation ?? 0,
  backgroundImageOffsetX: props.garden.background_image_offset_x ?? 0,
  backgroundImageOffsetY: props.garden.background_image_offset_y ?? 0,
  description: props.garden.description ?? "",
  zip_code: props.garden.zip_code ?? "",
  country: props.garden.country ?? "",
  city: props.garden.city ?? "",
  street_address: props.garden.street_address ?? "",
});

const loading = ref(false);
const deleting = ref(false);
const transformModalOpen = ref(false);
const openingTransformModal = ref(false);
const returnToEditModalAfterTransform = ref(false);

const form = ref();

const openTransformSettings = () => {
  openingTransformModal.value = true;
  returnToEditModalAfterTransform.value = true;
  open.value = false;
  transformModalOpen.value = true;
  openingTransformModal.value = false;
};

watch(
  () => props.garden,
  (newGarden) => {
    Object.assign(state, {
      name: newGarden.name,
      isPublic: newGarden.is_public || false,
      PixelsPerMeters: newGarden.pixels_per_meters || 20,
      defaultZoom: parseDefaultZoom(newGarden.default_zoom),
      variety_filter_mode: newGarden.variety_filter_mode,
      backgroundImage: undefined,
      backgroundImageRotation: newGarden.background_image_rotation ?? 0,
      backgroundImageOffsetX: newGarden.background_image_offset_x ?? 0,
      backgroundImageOffsetY: newGarden.background_image_offset_y ?? 0,
      description: newGarden.description ?? "",
      zip_code: newGarden.zip_code ?? "",
      country: newGarden.country ?? "",
      city: newGarden.city ?? "",
      street_address: newGarden.street_address ?? "",
    });
  },
  { deep: true },
);

watch(
  () => state.backgroundImageRotation,
  (rotation) => {
    if (!open.value && !transformModalOpen.value) return;
    emit("backgroundRotationPreview", normalizeRotation(Number(rotation)));
  },
);

watch(
  () => [state.backgroundImageOffsetX, state.backgroundImageOffsetY],
  ([offsetX, offsetY]) => {
    if (!open.value && !transformModalOpen.value) return;
    emit("backgroundOffsetPreview", {
      x: normalizeOffset(Number(offsetX)),
      y: normalizeOffset(Number(offsetY)),
    });
  },
);

watch(
  () => state.PixelsPerMeters,
  (pixelsPerMeters) => {
    if (!open.value && !transformModalOpen.value) return;
    emit(
      "pixelsPerMetersPreview",
      normalizePixelsPerMeters(Number(pixelsPerMeters)),
    );
  },
);

watch(
  () => state.defaultZoom,
  (defaultZoom) => {
    if (!open.value && !transformModalOpen.value) return;

    const normalized = normalizeDefaultZoomPercent(defaultZoom);
    emit("defaultZoomPreview", normalized);
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen && !openingTransformModal.value) {
      emit(
        "backgroundRotationPreview",
        normalizeRotation(props.garden.background_image_rotation ?? 0),
      );
      emit("backgroundOffsetPreview", {
        x: normalizeOffset(props.garden.background_image_offset_x ?? 0),
        y: normalizeOffset(props.garden.background_image_offset_y ?? 0),
      });
      emit(
        "pixelsPerMetersPreview",
        normalizePixelsPerMeters(props.garden.pixels_per_meters ?? 20),
      );

      const normalizedGardenDefaultZoom = normalizeDefaultZoomPercent(
        props.garden.default_zoom,
      );
      emit("defaultZoomPreview", normalizedGardenDefaultZoom);
    }
  },
);

watch(
  () => transformModalOpen.value,
  (isOpen) => {
    if (!isOpen && returnToEditModalAfterTransform.value) {
      open.value = true;
      returnToEditModalAfterTransform.value = false;
    }
  },
);

async function onSubmit(event: FormSubmitEvent<EditGardenSchema>) {
  loading.value = true;

  try {
    const validatedData = event.data;

    const gardenData = await updateGarden(
      props.garden.id,
      {
        name: validatedData.name,
        isPublic: validatedData.isPublic || false,
        backgroundImage: validatedData.backgroundImage,
        backgroundImageRotation: normalizeRotation(
          validatedData.backgroundImageRotation,
        ),
        backgroundImageOffsetX: normalizeOffset(
          validatedData.backgroundImageOffsetX,
        ),
        backgroundImageOffsetY: normalizeOffset(
          validatedData.backgroundImageOffsetY,
        ),
        PixelsPerMeters: validatedData.PixelsPerMeters,
        defaultZoom: parseDefaultZoom(validatedData.defaultZoom),
        variety_filter_mode: validatedData.variety_filter_mode,
        description: validatedData.description ?? null,
        zip_code: validatedData.zip_code ?? null,
        country: validatedData.country ?? null,
        city: validatedData.city ?? null,
        street_address: validatedData.street_address ?? null,
      },
      props.garden.background_image_url,
      props.garden.pixels_per_meters,
    );

    emit("gardenUpdated", gardenData);
    open.value = false;

    state.backgroundImage = undefined;
    state.defaultZoom = parseDefaultZoom(gardenData.default_zoom);
    state.backgroundImageRotation = gardenData.background_image_rotation ?? 0;
    state.backgroundImageOffsetX = gardenData.background_image_offset_x ?? 0;
    state.backgroundImageOffsetY = gardenData.background_image_offset_y ?? 0;
    state.description = gardenData.description ?? "";
    state.zip_code = gardenData.zip_code ?? "";
    state.country = gardenData.country ?? "";
    state.city = gardenData.city ?? "";
    state.street_address = gardenData.street_address ?? "";

    toast.add({
      title: "Garden Updated",
      description: "The garden has been successfully updated",
      color: "success",
    });
  } catch (error) {
    console.error("Error updating garden:", error);

    toast.add({
      title: "Error",
      description: "An error occurred while updating the garden",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

async function onDelete() {
  if (!canDeleteGarden.value) return;
  deleting.value = true;

  try {
    const imagePath = props.garden.background_image_url.split("/").pop() || "";

    await deleteGarden(props.garden.id, imagePath);

    emit("gardenDeleted", props.garden.id);
    open.value = false;
    showDeleteConfirmation.value = false;

    toast.add({
      title: "Garden Deleted",
      description: "The garden has been successfully deleted",
      color: "success",
    });
  } catch (error) {
    console.error("Error deleting garden:", error);

    toast.add({
      title: "Error",
      description: "An error occurred while deleting the garden",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function confirmDelete() {
  if (!canDeleteGarden.value) return;
  showDeleteConfirmation.value = true;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Garden"
    description="Update the garden details below."
  >
    <UButton
      v-if="isGardenOwner"
      label="Edit Garden"
      variant="outline"
      icon="i-heroicons-pencil-square-20-solid"
      class="justify-center"
    />

    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="grid grid-cols-2 gap-4"
        @submit="onSubmit"
      >
        <UFormField label="Garden Name" name="name" required class="col-span-2">
          <UInput
            v-model="state.name"
            placeholder="Enter garden name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description" name="description" class="col-span-2">
          <TiptapEditor
            v-model="state.description"
            :max-length="2000"
            placeholder="Enter a description (optional)"
          />
        </UFormField>

        <UFormField label="Country" name="country" class="col-span-1">
          <UInput
            v-model="state.country"
            class="w-full"
            placeholder="Country"
            :maxlength="100"
          />
        </UFormField>

        <UFormField label="City" name="city" class="col-span-1">
          <UInput
            v-model="state.city"
            class="w-full"
            placeholder="City"
            :maxlength="100"
          />
        </UFormField>

        <UFormField label="Zip Code" name="zip_code" class="col-span-1">
          <UInput
            v-model="state.zip_code"
            class="w-full"
            placeholder="Zip code"
            :maxlength="20"
          />
        </UFormField>

        <UFormField
          label="Street Address"
          name="street_address"
          class="col-span-1"
        >
          <UInput
            v-model="state.street_address"
            class="w-full"
            placeholder="Street name"
            :maxlength="100"
          />
        </UFormField>

        <UFormField label="Public Garden" name="isPublic" class="col-span-2">
          <USwitch
            v-model="state.isPublic"
            label="Make this garden visible to other"
          />
        </UFormField>

        <UFormField
          label="Variety Filter Mode"
          name="variety_filter_mode"
          description="Control which varieties are available for this garden"
          class="col-span-2"
          required
        >
          <USelect
            v-model="state.variety_filter_mode"
            :items="[
              { label: 'Garden varieties only', value: 'garden' },
              { label: 'Public varieties only', value: 'public' },
              { label: 'All varieties', value: 'all' },
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Map Transform"
          class="col-span-2"
          description="Adjust scale, rotation and position with live preview"
        >
          <div class="flex flex-col gap-2">
            <UButton
              type="button"
              variant="outline"
              icon="i-heroicons-adjustments-horizontal-20-solid"
              class="w-fit"
              @click="openTransformSettings"
            >
              Open Map Transform Settings
            </UButton>
            <p class="text-muted text-xs">
              Scale: {{ state.PixelsPerMeters }} px/m, Rotation:
              {{ state.backgroundImageRotation }} deg, X:
              {{ state.backgroundImageOffsetX }} px, Y:
              {{ state.backgroundImageOffsetY }} px, Default Zoom:
              {{
                state.defaultZoom !== null && state.defaultZoom !== undefined
                  ? `${state.defaultZoom}%`
                  : "auto-fit"
              }}
            </p>
          </div>
        </UFormField>

        <div class="col-span-2 space-y-2">
          <p class="text-sm font-medium">Current Background Image</p>
          <img
            :src="garden.background_image_url"
            :alt="garden.name"
            class="h-32 w-full rounded border object-cover"
          />
        </div>

        <UFormField
          name="backgroundImage"
          label="New Background Image (Optional)"
          class="col-span-2"
          description="JPEG, PNG, WebP. Max 5MB. Leave empty to keep current image."
        >
          <UFileUpload
            v-model="state.backgroundImage"
            accept="image/jpeg,image/png,image/webp"
            class="min-h-48"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-between">
        <div v-if="canDeleteGarden && !showDeleteConfirmation">
          <UButton
            color="error"
            variant="outline"
            icon="i-heroicons-trash-20-solid"
            :disabled="loading || deleting"
            @click="confirmDelete"
          >
            Delete
          </UButton>
        </div>

        <div
          v-else-if="canDeleteGarden && showDeleteConfirmation"
          class="flex gap-2"
        >
          <UButton
            variant="ghost"
            size="sm"
            @click="showDeleteConfirmation = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            size="sm"
            icon="i-heroicons-trash-20-solid"
            :loading="deleting"
            :disabled="deleting"
            @click="onDelete"
          >
            Confirm Delete
          </UButton>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            :disabled="loading || deleting"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            form="edit-garden-form"
            :loading="loading"
            :disabled="loading || deleting || showDeleteConfirmation"
            icon="i-heroicons-check-20-solid"
            @click="form.submit()"
          >
            Update Garden
          </UButton>
        </div>
      </div>
    </template>
  </UModal>

  <BackgroundImageTransformModal
    v-model:open="transformModalOpen"
    :pixels-per-meters="state.PixelsPerMeters ?? 20"
    :default-zoom="state.defaultZoom ?? null"
    :rotation="state.backgroundImageRotation ?? 0"
    :offset-x="state.backgroundImageOffsetX ?? 0"
    :offset-y="state.backgroundImageOffsetY ?? 0"
    :live-preview="true"
    @update:pixels-per-meters="state.PixelsPerMeters = $event"
    @update:default-zoom="state.defaultZoom = $event"
    @update:rotation="state.backgroundImageRotation = $event"
    @update:offset-x="state.backgroundImageOffsetX = $event"
    @update:offset-y="state.backgroundImageOffsetY = $event"
  />
</template>

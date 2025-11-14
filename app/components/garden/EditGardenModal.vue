<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { GardenData } from '~/types/garden'
import { z } from 'zod'
import { useGarden } from '~/composables/data/useGarden'

interface Props {
  garden: GardenData
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'gardenUpdated', data: GardenData): void
  (e: 'gardenDeleted', gardenId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { updateGarden, deleteGarden } = useGarden()

const showDeleteConfirmation = ref(false)

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  isPublic: z.boolean().optional(),
  PixelsPerMeters: z
    .number()
    .min(1, 'Scale must be at least 1 Pixels per Meters')
    .max(100, 'Scale cannot exceed 100 Pixels per Meters'),
  backgroundImage: z
    .instanceof(File, { message: 'Map file is required' })
    .optional()
    .refine(
      file => !file || file.size <= 5 * 1024 * 1024,
      'File size must not exceed 5MB',
    )
    .refine(
      file =>
        !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Unsupported image format (JPEG, PNG, WebP only)',
    ),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  zip_code: z
    .string()
    .max(20, 'Zip code cannot exceed 20 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'Country cannot exceed 100 characters')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'City cannot exceed 100 characters')
    .optional()
    .nullable(),
  street_address: z
    .string()
    .max(100, 'Street address cannot exceed 100 characters')
    .optional()
    .nullable(),
})

export type EditGardenSchema = z.output<typeof schema>

const state = reactive<Partial<EditGardenSchema>>({
  name: props.garden.name,
  isPublic: props.garden.is_public || false,
  PixelsPerMeters: props.garden.pixels_per_meters || 20,
  backgroundImage: undefined,
  description: props.garden.description ?? '',
  zip_code: props.garden.zip_code ?? '',
  country: props.garden.country ?? '',
  city: props.garden.city ?? '',
  street_address: props.garden.street_address ?? '',
})

const loading = ref(false)
const deleting = ref(false)

const form = ref()

watch(
  () => props.garden,
  (newGarden) => {
    Object.assign(state, {
      name: newGarden.name,
      isPublic: newGarden.is_public || false,
      PixelsPerMeters: newGarden.pixels_per_meters || 20,
      backgroundImage: undefined,
      description: newGarden.description ?? '',
      zip_code: newGarden.zip_code ?? '',
      country: newGarden.country ?? '',
      city: newGarden.city ?? '',
      street_address: newGarden.street_address ?? '',
    })
  },
  { deep: true },
)

async function onSubmit(event: FormSubmitEvent<EditGardenSchema>) {
  loading.value = true

  try {
    const validatedData = event.data

    const gardenData = await updateGarden(
      props.garden.id,
      {
        name: validatedData.name,
        isPublic: validatedData.isPublic || false,
        backgroundImage: validatedData.backgroundImage,
        PixelsPerMeters: validatedData.PixelsPerMeters,
        description: validatedData.description ?? null,
        zip_code: validatedData.zip_code ?? null,
        country: validatedData.country ?? null,
        city: validatedData.city ?? null,
        street_address: validatedData.street_address ?? null,
      },
      props.garden.background_image_url,
    )

    emit('gardenUpdated', gardenData)
    open.value = false

    state.backgroundImage = undefined
    state.description = gardenData.description ?? ''
    state.zip_code = gardenData.zip_code ?? ''
    state.country = gardenData.country ?? ''
    state.city = gardenData.city ?? ''
    state.street_address = gardenData.street_address ?? ''

    toast.add({
      title: 'Garden Updated',
      description: 'The garden has been successfully updated',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error updating garden:', error)

    toast.add({
      title: 'Error',
      description: 'An error occurred while updating the garden',
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

async function onDelete() {
  deleting.value = true

  try {
    const imagePath = props.garden.background_image_url.split('/').pop() || ''

    await deleteGarden(props.garden.id, imagePath)

    emit('gardenDeleted', props.garden.id)
    open.value = false
    showDeleteConfirmation.value = false

    toast.add({
      title: 'Garden Deleted',
      description: 'The garden has been successfully deleted',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error deleting garden:', error)

    toast.add({
      title: 'Error',
      description: 'An error occurred while deleting the garden',
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

function confirmDelete() {
  showDeleteConfirmation.value = true
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit Garden"
    description="Update the garden details below."
  >
    <UButton
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
        <UFormField
          label="Garden Name"
          name="name"
          required
          class="col-span-2"
        >
          <UInput
            v-model="state.name"
            placeholder="Enter garden name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          class="col-span-2"
        >
          <TiptapEditor
            v-model="state.description"
            :max-length="2000"
            placeholder="Enter a description (optional)"
          />
        </UFormField>

        <UFormField
          label="Country"
          name="country"
          class="col-span-1"
        >
          <UInput
            v-model="state.country"
            class="w-full"
            placeholder="Country"
            :maxlength="100"
          />
        </UFormField>

        <UFormField
          label="City"
          name="city"
          class="col-span-1"
        >
          <UInput
            v-model="state.city"
            class="w-full"
            placeholder="City"
            :maxlength="100"
          />
        </UFormField>

        <UFormField
          label="Zip Code"
          name="zip_code"
          class="col-span-1"
        >
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
            autocomplete="street-address"
            placeholder="Street name"
            :maxlength="100"
          />
        </UFormField>

        <UFormField
          label="Public Garden"
          name="isPublic"
          class="col-span-2"
        >
          <USwitch
            v-model="state.isPublic"
            label="Make this garden visible to other"
          />
        </UFormField>

        <UFormField
          label="Scale (Pixels per Meters)"
          name="PixelsPerMeters"
          description="How many pixels each meter represents"
          required
          class="col-span-2"
        >
          <UInput
            v-model.number="state.PixelsPerMeters"
            type="number"
            placeholder="20"
            min="1"
            max="100"
            step="1"
            class="w-full"
          />
        </UFormField>

        <div class="space-y-2 col-span-2">
          <label class="block text-sm font-medium">Current Background Image</label>
          <img
            :src="garden.background_image_url"
            :alt="garden.name"
            class="w-full h-32 object-cover rounded border"
          >
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
      <div class="flex justify-between w-full">
        <div v-if="!showDeleteConfirmation">
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
          v-else
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
</template>

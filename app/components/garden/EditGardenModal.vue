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
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
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
})

export type EditGardenSchema = z.output<typeof schema>

const state = reactive<Partial<EditGardenSchema>>({
  name: props.garden.name,
  backgroundColor: props.garden.background_color,
  PixelsPerMeters: props.garden.pixels_per_meters || 20,
  backgroundImage: undefined,
})

const chip = computed(() => ({ backgroundColor: state.backgroundColor }))

const loading = ref(false)
const deleting = ref(false)

const form = ref()

watch(
  () => props.garden,
  (newGarden) => {
    Object.assign(state, {
      name: newGarden.name,
      backgroundColor: newGarden.background_color,
      backgroundImage: undefined,
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
        backgroundColor: validatedData.backgroundColor,
        backgroundImage: validatedData.backgroundImage,
        PixelsPerMeters: validatedData.PixelsPerMeters,
      },
      props.garden.background_image_url,
    )

    emit('gardenUpdated', gardenData)
    open.value = false

    state.backgroundImage = undefined

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
          label="Background Color"
          name="backgroundColor"
          required
          class="col-span-2"
        >
          <UPopover>
            <UButton
              label="Choose color"
              color="neutral"
              variant="outline"
              class="w-full"
            >
              <template #leading>
                <span
                  :style="chip"
                  class="size-3 rounded-full"
                />
              </template>
            </UButton>

            <template #content>
              <UColorPicker
                v-model="state.backgroundColor"
                class="p-2"
              />
            </template>
          </UPopover>
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
          <label class="block text-sm font-medium text-gray-700">Current Background Image</label>
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
            color="neutral"
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
            color="neutral"
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

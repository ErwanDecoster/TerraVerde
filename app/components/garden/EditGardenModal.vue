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

// Delete confirmation state
const showDeleteConfirmation = ref(false)

// Validation schema with Zod (same as AddGardenModal but backgroundImage is optional)
const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  position: z.object({
    x: z.number().min(0, 'X position must be positive'),
    y: z.number().min(0, 'Y position must be positive'),
  }),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
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

// Form state - initialize with existing garden data
const state = reactive<Partial<EditGardenSchema>>({
  name: props.garden.name,
  position: { x: props.garden.x_position, y: props.garden.y_position },
  backgroundColor: props.garden.background_color,
  backgroundImage: undefined,
})

// Computed for color chip
const chip = computed(() => ({ backgroundColor: state.backgroundColor }))

// Submission state
const loading = ref(false)
const deleting = ref(false)

// Form reference
const form = ref()

// Watch for prop changes to update form state
watch(
  () => props.garden,
  (newGarden) => {
    Object.assign(state, {
      name: newGarden.name,
      position: { x: newGarden.x_position, y: newGarden.y_position },
      backgroundColor: newGarden.background_color,
      backgroundImage: undefined,
    })
  },
  { deep: true },
)

// Submission function
async function onSubmit(event: FormSubmitEvent<EditGardenSchema>) {
  loading.value = true

  try {
    // Data is already validated by the schema
    const validatedData = event.data

    // Use the composable to update the garden
    const gardenData = await updateGarden(
      props.garden.id,
      {
        name: validatedData.name,
        position: validatedData.position,
        backgroundColor: validatedData.backgroundColor,
        backgroundImage: validatedData.backgroundImage,
      },
      props.garden.background_image_url, // Pass current image path for cleanup
    )

    emit('gardenUpdated', gardenData)
    open.value = false

    // Reset backgroundImage field only (keep other fields as they are the updated values)
    state.backgroundImage = undefined

    // Success notification
    toast.add({
      title: 'Garden Updated',
      description: 'The garden has been successfully updated',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error updating garden:', error)

    // Error notification
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

// Delete function
async function onDelete() {
  deleting.value = true

  try {
    // Extract the image path from the URL for cleanup
    const imagePath = props.garden.background_image_url.split('/').pop() || ''

    await deleteGarden(props.garden.id, imagePath)

    emit('gardenDeleted', props.garden.id)
    open.value = false
    showDeleteConfirmation.value = false

    // Success notification
    toast.add({
      title: 'Garden Deleted',
      description: 'The garden has been successfully deleted',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error deleting garden:', error)

    // Error notification
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

// Confirm delete function
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
      color="neutral"
      variant="subtle"
      icon="i-heroicons-pencil-square-20-solid"
    />

    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UFormField
          label="Garden Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Enter garden name"
          />
        </UFormField>

        <!-- Position -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="X Position">
            <UInput
              v-model.number="state.position!.x"
              type="number"
              placeholder="0"
              min="0"
              step="1"
            />
          </UFormField>
          <UFormField label="Y Position">
            <UInput
              v-model.number="state.position!.y"
              type="number"
              placeholder="0"
              min="0"
              step="1"
            />
          </UFormField>
        </div>

        <!-- Background color -->
        <UFormField
          label="Background Color"
          name="backgroundColor"
          required
        >
          <UPopover>
            <UButton
              label="Choose color"
              color="neutral"
              variant="outline"
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

        <!-- Current Background Image Preview -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Current Background Image</label>
          <img
            :src="garden.background_image_url"
            :alt="garden.name"
            class="w-full h-32 object-cover rounded border"
          >
        </div>

        <!-- Background Image Upload -->
        <UFormField
          name="backgroundImage"
          label="New Background Image (Optional)"
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
        <!-- Left side: Delete button -->
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

        <!-- Delete confirmation -->
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

        <!-- Right side: Cancel and Update buttons -->
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

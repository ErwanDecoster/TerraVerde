<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { GardenData } from '~/types/garden'
import { z } from 'zod'

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'gardenAdded', data: GardenData): void
}

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()

// Validation schema with Zod
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

export type GardenSchema = z.output<typeof schema>

// Form state
const state = reactive<Partial<GardenSchema>>({
  name: '',
  position: { x: 0, y: 0 },
  backgroundColor: '#ffffff',
  backgroundImage: undefined,
})

// Computed for color chip
const chip = computed(() => ({ backgroundColor: state.backgroundColor }))

// Submission state
const loading = ref(false)

// Form reference
const form = ref()

// Submission function
async function onSubmit(event: FormSubmitEvent<GardenSchema>) {
  loading.value = true

  try {
    // Data is already validated by the schema
    const validatedData = event.data

    const uuid = crypto.randomUUID()

    const image = await supabaseClient.storage
      .from('maps')
      .upload(uuid, validatedData.backgroundImage)

    const { data, error } = await supabaseClient
      .from('garden_config')
      .insert({
        id: uuid,
        name: validatedData.name,
        x_position: validatedData.position.x,
        y_position: validatedData.position.y,
        background_color: validatedData.backgroundColor,
        background_image_url: image.data?.path || '',
        image_width: 0, // TODO get actual dimensions
        image_height: 0, // TODO get actual dimensions
      })
      .select()
      .single()

    if (error) {
      try {
        const fullPath = image.data?.fullPath || ''
        await supabaseClient.storage.from('maps').remove([fullPath])
      }
      catch (cleanupError) {
        console.warn(
          'Failed to clean up uploaded image after DB error:',
          cleanupError,
        )
      }
      throw new Error(`Error adding photo: ${error.message}`)
    }
    const project_id = 'tvqeubgblmwvracewenz' // use env variable in real code
    const bucket = 'maps'
    const gardenData: GardenData = {
      ...data,
      background_image_url: `https://${project_id}.supabase.co/storage/v1/object/public/${bucket}/${data.imagePath}`,
    }
    emit('gardenAdded', gardenData)

    open.value = false

    // Reset form
    Object.assign(state, {
      name: '',
      position: { x: 0, y: 0 },
      backgroundColor: '#ffffff',
      backgroundImage: undefined,
    })

    // Success notification
    toast.add({
      title: 'Garden Added',
      description: 'The garden has been successfully added',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error adding garden:', error)

    // Error notification
    toast.add({
      title: 'Error',
      description: 'An error occurred while adding the garden',
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add New Garden"
    description="Fill in the details below to add a new garden."
  >
    <UButton
      label="Add Garden"
      color="neutral"
      variant="subtle"
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

        <!-- Background Image Upload -->
        <UFormField
          name="backgroundImage"
          label="Background Image"
          description="JPEG, PNG, WebP. Max 5MB"
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
      <UButton
        color="neutral"
        variant="ghost"
        :disabled="loading"
        @click="close"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        form="map-form"
        :loading="loading"
        :disabled="loading"
        icon="i-heroicons-plus-20-solid"
        @click="form.submit()"
      >
        Add Garden
      </UButton>
    </template>
  </UModal>
</template>

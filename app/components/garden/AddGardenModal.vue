<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { GardenData } from '~/types/garden'
import { z } from 'zod'
import { useGarden } from '~/composables/data/useGarden'

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'gardenAdded', data: GardenData): void
}

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { addGarden } = useGarden()

// Validation schema with Zod
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
  backgroundColor: '#ffffff',
  PixelsPerMeters: 20,
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

    // Use the composable to add the garden
    const gardenData = await addGarden({
      name: validatedData.name,
      backgroundColor: validatedData.backgroundColor,
      backgroundImage: validatedData.backgroundImage,
      PixelsPerMeters: validatedData.PixelsPerMeters,
    })

    emit('gardenAdded', gardenData)
    open.value = false

    // Reset form
    Object.assign(state, {
      name: '',
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
            class="w-full"
            placeholder="Enter garden name"
          />
        </UFormField>

        <!-- Background color -->
        <UFormField
          label="Background Color"
          name="backgroundColor"
          class="col-span-2"
          required
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

        <!-- Scale (Pixels per Meters) -->
        <UFormField
          label="Scale (Pixels per Meters)"
          name="PixelsPerMeters"
          description="How many pixels each meter represents"
          class="col-span-2"
          required
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

        <!-- Background Image Upload -->
        <UFormField
          name="backgroundImage"
          label="Background Image"
          description="JPEG, PNG, WebP. Max 5MB"
          class="col-span-2"
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

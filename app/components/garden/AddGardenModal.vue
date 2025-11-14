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

export type GardenSchema = z.output<typeof schema>

const state = reactive<Partial<GardenSchema>>({
  name: '',
  isPublic: false,
  PixelsPerMeters: 20,
  backgroundImage: undefined,
  description: '',
  zip_code: '',
  country: '',
  city: '',
  street_address: '',
})

const loading = ref(false)

const form = ref()

async function onSubmit(event: FormSubmitEvent<GardenSchema>) {
  loading.value = true

  try {
    const validatedData = event.data

    const gardenData = await addGarden({
      name: validatedData.name,
      isPublic: validatedData.isPublic || false,
      backgroundImage: validatedData.backgroundImage,
      PixelsPerMeters: validatedData.PixelsPerMeters,
      description: validatedData.description ?? null,
      zip_code: validatedData.zip_code ?? null,
      country: validatedData.country ?? null,
      city: validatedData.city ?? null,
      street_address: validatedData.street_address ?? null,
    })

    emit('gardenAdded', gardenData)
    open.value = false

    Object.assign(state, {
      name: '',
      isPublic: false,
      PixelsPerMeters: 20,
      backgroundImage: undefined,
      description: '',
      zip_code: '',
      country: '',
      city: '',
      street_address: '',
    })

    toast.add({
      title: 'Garden Added',
      description: 'The garden has been successfully added',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error adding garden:', error)

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
          label="Street Name"
          name="street_address"
          class="col-span-1"
        >
          <UInput
            v-model="state.street_address"
            class="w-full"
            placeholder="Street name"
            autocomplete="street-address"
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
      <div class="flex justify-end gap-0.5 w-full">
        <UButton
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
      </div>
    </template>
  </UModal>
</template>

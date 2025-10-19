<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PlantData, PlantCategory, PlantStatus } from '~/types/plant'
import { PLANT_CATEGORIES, PLANT_STATUSES } from '~/types/plant'
import { z } from 'zod'
import { usePlant } from '~/composables/data/usePlant'

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'plantAdded', data: PlantData): void
}

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { addPlant } = usePlant()

// Validation schema with Zod
const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  category: z.enum(
    ['arbre', 'arbre_fruitier', 'arbuste', 'fleur', 'legume', 'herbe', 'autre'],
    {
      message: 'Category is required',
    },
  ),
  status: z.enum(['healthy', 'sick', 'dead', 'planted'], {
    message: 'Status is required',
  }),
  planted_date: z.string().min(1, 'Planted date is required'),
  main_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
  height: z
    .number()
    .min(0, 'Height must be positive')
    .max(1000, 'Height cannot exceed 1000cm'),
  width: z
    .number()
    .min(0, 'Width must be positive')
    .max(1000, 'Width cannot exceed 1000cm'),
})

export type PlantSchema = z.output<typeof schema>

// Form state
const state = reactive<Partial<PlantSchema>>({
  name: '',
  description: '',
  category: 'fleur' as PlantCategory,
  status: 'planted' as PlantStatus,
  planted_date: new Date().toISOString().split('T')[0], // Today's date
  main_color: '#22c55e',
  height: 0,
  width: 0,
})

// Computed for color chip
const chip = computed(() => ({ backgroundColor: state.main_color }))

// Submission state
const loading = ref(false)

// Form reference
const form = ref()

// Submission function
async function onSubmit(event: FormSubmitEvent<PlantSchema>) {
  loading.value = true

  try {
    // Data is already validated by the schema
    const validatedData = event.data

    // Use the composable to add the plant
    const plantData = await addPlant({
      name: validatedData.name,
      description: validatedData.description || '',
      category: validatedData.category,
      status: validatedData.status,
      planted_date: validatedData.planted_date,
      main_color: validatedData.main_color,
      height: validatedData.height,
      width: validatedData.width,
    })

    emit('plantAdded', plantData)
    open.value = false

    // Reset form
    Object.assign(state, {
      name: '',
      description: '',
      category: 'fleur' as PlantCategory,
      status: 'planted' as PlantStatus,
      planted_date: new Date().toISOString().split('T')[0],
      main_color: '#22c55e',
      height: 0,
      width: 0,
    })

    // Success notification
    toast.add({
      title: 'Plant Added',
      description: 'The plant has been successfully added',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error adding plant:', error)

    // Error notification
    toast.add({
      title: 'Error',
      description: 'An error occurred while adding the plant',
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
    title="Add New Plant"
    description="Fill in the details below to add a new plant."
  >
    <UButton
      label="Add Plant"
      color="neutral"
      variant="subtle"
      icon="i-heroicons-plus-20-solid"
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
          label="Plant Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Enter plant name"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Describe your plant..."
            :rows="3"
          />
        </UFormField>

        <!-- Category and Status -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Category"
            name="category"
            required
          >
            <USelect
              v-model="state.category"
              :options="PLANT_CATEGORIES"
              placeholder="Select category"
            />
          </UFormField>
          <UFormField
            label="Status"
            name="status"
            required
          >
            <USelect
              v-model="state.status"
              :options="PLANT_STATUSES"
              placeholder="Select status"
            />
          </UFormField>
        </div>

        <!-- Planted date -->
        <UFormField
          label="Planted Date"
          name="planted_date"
          required
        >
          <UInput
            v-model="state.planted_date"
            type="date"
          />
        </UFormField>

        <!-- Main color -->
        <UFormField
          label="Main Color"
          name="main_color"
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
                v-model="state.main_color"
                class="p-2"
              />
            </template>
          </UPopover>
        </UFormField>

        <!-- Dimensions -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Height (cm)"
            name="height"
          >
            <UInput
              v-model.number="state.height"
              type="number"
              placeholder="0"
              min="0"
              max="1000"
              step="1"
            />
          </UFormField>
          <UFormField
            label="Width (cm)"
            name="width"
          >
            <UInput
              v-model.number="state.width"
              type="number"
              placeholder="0"
              min="0"
              max="1000"
              step="1"
            />
          </UFormField>
        </div>
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
        form="plant-form"
        :loading="loading"
        :disabled="loading"
        icon="i-heroicons-plus-20-solid"
        @click="form.submit()"
      >
        Add Plant
      </UButton>
    </template>
  </UModal>
</template>

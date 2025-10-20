<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PlantData } from '~/types/plant'
import { PLANT_CATEGORIES, PLANT_STATUSES } from '~/types/plant'
import { z } from 'zod'
import { usePlant } from '~/composables/data/usePlant'

interface Props {
  plant: PlantData
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'plantUpdated', data: PlantData): void
  (e: 'plantDeleted', plantId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { updatePlant, deletePlant } = usePlant()

// Delete confirmation state
const showDeleteConfirmation = ref(false)

// Validation schema with Zod (same as AddPlantModal)
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

export type EditPlantSchema = z.output<typeof schema>

// Form state - initialize with existing plant data
const state = reactive<Partial<EditPlantSchema>>({
  name: props.plant.name,
  description: props.plant.description,
  category: props.plant.category,
  status: props.plant.status,
  planted_date: props.plant.planted_date,
  main_color: props.plant.main_color,
  height: props.plant.height,
  width: props.plant.width,
})

// Computed for color chip
const chip = computed(() => ({ backgroundColor: state.main_color }))

// Submission state
const loading = ref(false)
const deleting = ref(false)

// Form reference
const form = ref()

// Watch for prop changes to update form state
watch(
  () => props.plant,
  (newPlant) => {
    Object.assign(state, {
      name: newPlant.name,
      description: newPlant.description,
      category: newPlant.category,
      status: newPlant.status,
      planted_date: newPlant.planted_date,
      main_color: newPlant.main_color,
      height: newPlant.height,
      width: newPlant.width,
    })
  },
  { deep: true },
)

// Submission function
async function onSubmit(event: FormSubmitEvent<EditPlantSchema>) {
  loading.value = true

  try {
    // Data is already validated by the schema
    const validatedData = event.data

    // Use the composable to update the plant
    const plantData = await updatePlant(props.plant.id, {
      name: validatedData.name,
      description: validatedData.description || '',
      category: validatedData.category,
      status: validatedData.status,
      planted_date: validatedData.planted_date,
      main_color: validatedData.main_color,
      height: validatedData.height,
      width: validatedData.width,
    })

    emit('plantUpdated', plantData)
    open.value = false

    // Success notification
    toast.add({
      title: 'Plant Updated',
      description: 'The plant has been successfully updated',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error updating plant:', error)

    // Error notification
    toast.add({
      title: 'Error',
      description: 'An error occurred while updating the plant',
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
    await deletePlant(props.plant.id)

    emit('plantDeleted', props.plant.id)
    open.value = false
    showDeleteConfirmation.value = false

    // Success notification
    toast.add({
      title: 'Plant Deleted',
      description: 'The plant has been successfully deleted',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error deleting plant:', error)

    // Error notification
    toast.add({
      title: 'Error',
      description: 'An error occurred while deleting the plant',
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
    title="Edit Plant"
    description="Update the plant details below."
  >
    <UButton
      label="Edit Plant"
      color="neutral"
      variant="subtle"
      icon="i-heroicons-pencil-square-20-solid"
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
          label="Plant Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Enter plant name"
          />
        </UFormField>
        <UFormField
          label="Category"
          name="category"
          required
        >
          <USelect
            v-model="state.category"
            :items="PLANT_CATEGORIES.slice()"
            class="w-full"
            placeholder="Select category"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
          class="col-span-2"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Describe your plant..."
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <UFormField
          label="Planted Date"
          name="planted_date"
          required
        >
          <UInput
            v-model="state.planted_date"
            type="date"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Status"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :items="PLANT_STATUSES.slice()"
            class="w-full z-10"
            placeholder="Select status"
          />
        </UFormField>

        <UFormField
          label="Main Color"
          name="main_color"
          required
        >
          <UPopover>
            <UButton
              label="Choose color"
              class="w-full"
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
            label="Height (meters)"
            name="height"
          >
            <UInput
              v-model.number="state.height"
              type="number"
              class="w-full"
              placeholder="0"
              min="0"
              max="1000"
              step="1"
            />
          </UFormField>
          <UFormField
            label="Width (meters)"
            name="width"
          >
            <UInput
              v-model.number="state.width"
              type="number"
              class="w-full"
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
            form="edit-plant-form"
            :loading="loading"
            :disabled="loading || deleting || showDeleteConfirmation"
            icon="i-heroicons-check-20-solid"
            @click="form.submit()"
          >
            Update Plant
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

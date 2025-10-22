<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PlantData } from '~/types/plant'
import type { VarietyData } from '~/types/variety'
import { PLANT_STATUSES } from '~/types/plant'
import { z } from 'zod'
import { usePlant } from '~/composables/data/usePlant'
import { useVariety } from '~/composables/data/useVariety'
import AddVarietyModal from '~/components/variety/AddVarietyModal.vue'
import EditVarietyModal from '~/components/variety/EditVarietyModal.vue'

interface Props {
  plant: PlantData
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'plantUpdated' | 'plantCopied', data: PlantData): void
  (e: 'plantDeleted', plantId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { updatePlant, deletePlant, addMultiplePlants } = usePlant()
const { fetchVarieties } = useVariety()

// Varieties state
const varieties = ref<VarietyData[]>([])
const varietiesLoading = ref(false)

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
  variety_id: z.string(),
  status: z.enum(['healthy', 'sick', 'dead', 'planted'], {
    message: 'Status is required',
  }),
  planted_date: z.string().min(1, 'Planted date is required'),
  height: z
    .number()
    .min(0.1, 'Height must be more than 0.1')
    .max(150, 'Height cannot exceed 150 meters'),
  width: z
    .number()
    .min(0.1, 'Width must be more than 0.1')
    .max(40, 'Width cannot exceed 40 meters'),
})

export type EditPlantSchema = z.output<typeof schema>

// Form state - initialize with existing plant data
const state = reactive<Partial<EditPlantSchema>>({
  name: props.plant.name,
  description: props.plant.description,
  variety_id: props.plant.variety_id?.toString() || '',
  status: props.plant.status,
  planted_date: props.plant.planted_date,
  height: props.plant.height,
  width: props.plant.width,
})

// Submission state
const loading = ref(false)
const deleting = ref(false)

// Multiple plant copying
const multipleCopyingCount = ref(1)
const copying = ref(false)

// Form reference
const form = ref()

// Computed varieties options for select
const varietyOptions = computed(() => {
  return varieties.value.map(variety => ({
    label: `${variety.name} ${
      variety.scientific_name ? `(${variety.scientific_name})` : ''
    }`,
    value: variety.id.toString(),
  }))
})

// Load varieties when modal opens
const loadVarieties = async () => {
  if (varieties.value.length > 0) return // Already loaded
  varietiesLoading.value = true
  try {
    varieties.value = await fetchVarieties()
  }
  catch (error) {
    console.error('Error loading varieties:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load varieties',
      color: 'error',
    })
  }
  finally {
    varietiesLoading.value = false
  }
}

// Watch for modal opening to load varieties
onMounted(() => {
  loadVarieties()
})

// Handle new variety added
const onVarietyAdded = (newVariety: VarietyData) => {
  varieties.value.unshift(newVariety)
  // Auto-select the new variety
  state.variety_id = newVariety.id.toString()
}

// Handle variety updated
const onVarietyUpdated = (updatedVariety: VarietyData) => {
  const index = varieties.value.findIndex(v => v.id === updatedVariety.id)
  if (index !== -1) {
    varieties.value[index] = updatedVariety
  }
}

// Get currently selected variety
const selectedVariety = computed(() => {
  if (!state.variety_id) return null
  return (
    varieties.value.find(v => v.id.toString() === state.variety_id) || null
  )
})

// Watch for prop changes to update form state
watch(
  () => props.plant,
  (newPlant) => {
    Object.assign(state, {
      name: newPlant.name,
      description: newPlant.description,
      variety_id: newPlant.variety_id?.toString() || '',
      status: newPlant.status,
      planted_date: newPlant.planted_date,
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
      variety_id: parseInt(validatedData.variety_id),
      status: validatedData.status,
      planted_date: validatedData.planted_date,
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

// Copy plant function
async function copyPlant() {
  copying.value = true

  try {
    // Use the original plant data as fallback for required fields
    const validatedData = {
      name: state.name || props.plant.name,
      description: state.description || props.plant.description || '',
      variety_id: parseInt(
        state.variety_id || props.plant.variety_id?.toString() || '0',
      ),
      status: state.status || props.plant.status,
      planted_date: state.planted_date || props.plant.planted_date,
      height: state.height || props.plant.height,
      width: state.width || props.plant.width,
    }

    // Calculate spacing based on plant width in pixels
    const plantWidthMeters = validatedData.width || 1 // Default to 1 meter if no width
    const spacingMultiplier = 1.5 // Space plants 1.5x their width apart
    const spacingMeters
      = plantWidthMeters * spacingMultiplier + plantWidthMeters

    const plantsToCreate = Array.from(
      { length: multipleCopyingCount.value },
      (_, index) => ({
        name: validatedData.name,
        description: validatedData.description,
        variety_id: validatedData.variety_id,
        status: validatedData.status,
        planted_date: validatedData.planted_date,
        height: validatedData.height,
        width: validatedData.width,
        // Position copies based on plant width - 3 plants per row
        x_position: (props.plant.x_position || 0) + (index % 3) * spacingMeters,
        y_position:
          (props.plant.y_position || 0) + Math.floor(index / 3) * spacingMeters,
        garden_id: props.plant.garden_id || '',
      }),
    )

    const createdPlants = await addMultiplePlants(plantsToCreate)

    // Emit each copied plant individually so the parent can add them
    createdPlants.forEach((plant: PlantData) => emit('plantCopied', plant))

    // Success notification
    const plantCount = multipleCopyingCount.value
    toast.add({
      title: plantCount === 1 ? 'Plant Copied' : 'Plants Copied',
      description:
        plantCount === 1
          ? 'The plant has been successfully copied'
          : `${plantCount} plants have been successfully copied`,
      color: 'success',
    })

    // Reset copy count
    multipleCopyingCount.value = 1
  }
  catch (error) {
    console.error('Error copying plant:', error)

    // Error notification
    toast.add({
      title: 'Error',
      description: 'An error occurred while copying the plant',
      color: 'error',
    })
  }
  finally {
    copying.value = false
  }
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
          class="col-span-2"
        >
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Enter plant name"
          />
        </UFormField>
        <UFormField
          label="Variety"
          name="variety_id"
          required
          class="col-span-2"
        >
          <div class="grid gap-2">
            <UInputMenu
              v-model="state.variety_id"
              :items="varietyOptions"
              :loading="varietiesLoading"
              :value-key="'value'"
              placeholder="Select variety"
              searchable
            />
            <div class="flex gap-2">
              <AddVarietyModal @variety-added="onVarietyAdded">
                <UButton
                  icon="i-heroicons-plus-20-solid"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :disabled="loading"
                />
              </AddVarietyModal>
              <EditVarietyModal
                v-if="selectedVariety"
                :variety="selectedVariety"
                @variety-updated="onVarietyUpdated"
              >
                <UButton
                  icon="i-heroicons-pencil-square-20-solid"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :disabled="loading"
                />
              </EditVarietyModal>
            </div>
          </div>
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

        <!-- Right side: Cancel, Update and Copy buttons -->
        <div class="flex gap-0.5">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="loading || deleting || copying"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            form="edit-plant-form"
            :loading="loading"
            :disabled="loading || deleting || showDeleteConfirmation || copying"
            icon="i-heroicons-check-20-solid"
            @click="form.submit()"
          >
            Update Plant
          </UButton>
          <UPopover>
            <UButton
              aria-label="Copy Options"
              icon="i-lucide-chevron-down"
              :disabled="
                loading || deleting || showDeleteConfirmation || copying
              "
            />

            <template #content>
              <div class="grid p-2">
                <span>Copy multiple</span>
                <USelect
                  v-model="multipleCopyingCount"
                  :items="Array.from({ length: 10 }, (_, i) => i + 1)"
                />
                <UButton
                  color="primary"
                  variant="outline"
                  :loading="copying"
                  :disabled="
                    loading || deleting || showDeleteConfirmation || copying
                  "
                  icon="i-heroicons-document-duplicate-20-solid"
                  @click="copyPlant"
                >
                  Copy
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
    </template>
  </UModal>
</template>

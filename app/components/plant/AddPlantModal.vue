<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PlantData, PlantStatus } from '~/types/plant'
import type { VarietyData } from '~/types/variety'
import { PLANT_STATUSES } from '~/types/plant'
import { z } from 'zod'
import { usePlant } from '~/composables/data/usePlant'
import { useVariety } from '~/composables/data/useVariety'
import AddVarietyModal from '~/components/variety/AddVarietyModal.vue'

interface Props {
  gardenId?: string
  clickCoordinates?: { x: number, y: number } | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'plantAdded', data: PlantData): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { addPlant, addMultiplePlants } = usePlant()
const { fetchVarieties } = useVariety()

// Varieties state
const varieties = ref<VarietyData[]>([])
const varietiesLoading = ref(false)

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
  variety_id: z.string(),
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
  variety_id: '',
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

// Multiple plants creation
const multipleAddingCount = ref(1)

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

// Submission function
async function onSubmit(event: FormSubmitEvent<PlantSchema>) {
  loading.value = true

  try {
    // Data is already validated by the schema
    const validatedData = event.data

    if (multipleAddingCount.value === 1) {
      // Single plant creation
      const plantData = await addPlant({
        name: validatedData.name,
        description: validatedData.description || '',
        variety_id: parseInt(validatedData.variety_id),
        status: validatedData.status,
        planted_date: validatedData.planted_date,
        main_color: validatedData.main_color,
        height: validatedData.height,
        width: validatedData.width,
        x_position: props.clickCoordinates?.x || 0,
        y_position: props.clickCoordinates?.y || 0,
        garden_id: props.gardenId || '',
      })

      emit('plantAdded', plantData)
    }
    else {
      // Multiple plants creation
      const baseX = props.clickCoordinates?.x || 0
      const baseY = props.clickCoordinates?.y || 0

      // Calculate spacing based on plant width for realistic positioning
      const plantWidthMeters = validatedData.width
      const spacingMultiplier = 1.5 // Space plants 1.5x their width apart
      const spacingMeters
        = plantWidthMeters * spacingMultiplier + plantWidthMeters

      // Create array of plant data for bulk insert
      const plantsToCreate = Array.from(
        { length: multipleAddingCount.value },
        (_, index) => ({
          name: `${validatedData.name}`,
          description: validatedData.description || '',
          variety_id: parseInt(validatedData.variety_id),
          status: validatedData.status,
          planted_date: validatedData.planted_date,
          main_color: validatedData.main_color,
          height: validatedData.height,
          width: validatedData.width,
          // Distribute plants in a grid pattern with spacing based on plant width
          x_position: baseX + (index % 3) * spacingMeters, // 3 plants per row
          y_position: baseY + Math.floor(index / 3) * spacingMeters, // New row every 3 plants
          garden_id: props.gardenId || '',
        }),
      )

      const createdPlants = await addMultiplePlants(plantsToCreate)

      // Emit each plant individually so the parent can add them
      createdPlants.forEach((plant: PlantData) => emit('plantAdded', plant))
    }

    // Success notification
    const plantCount = multipleAddingCount.value
    toast.add({
      title: plantCount === 1 ? 'Plant Added' : 'Plants Added',
      description:
        plantCount === 1
          ? 'The plant has been successfully added'
          : `${plantCount} plants have been successfully added`,
      color: 'success',
    })

    open.value = false

    // Reset form
    Object.assign(state, {
      name: '',
      description: '',
      variety_id: '',
      status: 'planted' as PlantStatus,
      planted_date: new Date().toISOString().split('T')[0],
      main_color: '#22c55e',
      height: 0,
      width: 0,
    })

    // Reset multiple count
    multipleAddingCount.value = 1
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
          label="Variety"
          name="variety_id"
          required
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
            <AddVarietyModal @variety-added="onVarietyAdded">
              <UButton
                icon="i-heroicons-plus-20-solid"
                size="sm"
                color="neutral"
                variant="outline"
                :disabled="loading"
              />
            </AddVarietyModal>
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
            class="w-full"
            placeholder="Select status"
          />
        </UFormField>

        <UFormField
          label="Main Color"
          name="main_color"
          class="col-span-2"
          required
          :ui="{ container: 'grid grid-cols-2 gap-4' }"
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
          <UInput
            v-model="state.main_color"
            type="string"
            class="w-full"
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
      <div class="flex justify-end gap-0.5 w-full">
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
          Add {{ multipleAddingCount > 1 ? "Plants" : "Plant" }}
        </UButton>
        <UPopover>
          <UButton
            aria-label="Open"
            icon="i-lucide-chevron-down"
          />

          <template #content>
            <div class="grid p-2">
              <span>Add number</span>
              <USelect
                v-model="multipleAddingCount"
                :items="Array.from({ length: 10 }, (_, i) => i + 1)"
              />
            </div>
          </template>
        </UPopover>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PlantData, PlantStatus } from '~/types/plant'
import type { VarietyData } from '~/types/variety'
import { PLANT_STATUSES } from '~/types/plant'
import { z } from 'zod'
import { usePlant } from '~/composables/data/usePlant'
import { useVariety } from '~/composables/data/useVariety'
import AddVarietyModal from '~/components/variety/AddVarietyModal.vue'
import EditVarietyModal from '../variety/EditVarietyModal.vue'

interface Props {
  gardenId?: string
  clickCoordinates?: { x: number, y: number } | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'plantAdded', data: PlantData): void
  (e: 'varietyUpdated', data: VarietyData): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { addPlant, addMultiplePlants } = usePlant()
const { fetchVarieties } = useVariety()

const varieties = ref<VarietyData[]>([])
const varietiesLoading = ref(false)

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

export type PlantSchema = z.output<typeof schema>

const state = reactive<Partial<PlantSchema>>({
  name: '',
  description: '',
  variety_id: '',
  status: 'planted' as PlantStatus,
  planted_date: new Date().toISOString().split('T')[0],
  height: 0.5,
  width: 0.5,
})

const loading = ref(false)

const multipleAddingCount = ref(1)

const form = ref()

const varietyOptions = computed(() => {
  return varieties.value.map(variety => ({
    label: `${variety.name} ${
      variety.scientific_name ? `(${variety.scientific_name})` : ''
    }`,
    value: variety.id.toString(),
  }))
})

const loadVarieties = async () => {
  if (varieties.value.length > 0) return
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

onMounted(() => {
  loadVarieties()
})

const onVarietyAdded = (newVariety: VarietyData) => {
  varieties.value.unshift(newVariety)

  state.variety_id = newVariety.id.toString()
}

const onVarietyUpdated = (updatedVariety: VarietyData) => {
  const index = varieties.value.findIndex(v => v.id === updatedVariety.id)
  if (index !== -1) {
    varieties.value[index] = updatedVariety
  }
  emit('varietyUpdated', updatedVariety)
}

const selectedVariety = computed(() => {
  if (!state.variety_id) return null
  return (
    varieties.value.find(v => v.id.toString() === state.variety_id) || null
  )
})

async function onSubmit(event: FormSubmitEvent<PlantSchema>) {
  loading.value = true

  try {
    const validatedData = event.data

    if (multipleAddingCount.value === 1) {
      const plantData = await addPlant({
        name: validatedData.name,
        description: validatedData.description || '',
        variety_id: parseInt(validatedData.variety_id),
        status: validatedData.status,
        planted_date: validatedData.planted_date,
        height: validatedData.height,
        width: validatedData.width,
        x_position: props.clickCoordinates?.x || 0,
        y_position: props.clickCoordinates?.y || 0,
        garden_id: props.gardenId || '',
      })

      emit('plantAdded', plantData)
    }
    else {
      const baseX = props.clickCoordinates?.x || 0
      const baseY = props.clickCoordinates?.y || 0

      const plantWidthMeters = validatedData.width
      const spacingMultiplier = 1.5
      const spacingMeters
        = plantWidthMeters * spacingMultiplier + plantWidthMeters

      const plantsToCreate = Array.from(
        { length: multipleAddingCount.value },
        (_, index) => ({
          name: `${validatedData.name}`,
          description: validatedData.description || '',
          variety_id: parseInt(validatedData.variety_id),
          status: validatedData.status,
          planted_date: validatedData.planted_date,
          height: validatedData.height,
          width: validatedData.width,

          x_position: baseX + (index % 3) * spacingMeters,
          y_position: baseY + Math.floor(index / 3) * spacingMeters,
          garden_id: props.gardenId || '',
        }),
      )

      const createdPlants = await addMultiplePlants(plantsToCreate)

      createdPlants.forEach((plant: PlantData) => emit('plantAdded', plant))
    }

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

    Object.assign(state, {
      name: '',
      description: '',
      variety_id: '',
      status: 'planted' as PlantStatus,
      planted_date: new Date().toISOString().split('T')[0],
      height: 0,
      width: 0,
    })

    multipleAddingCount.value = 1
  }
  catch (error) {
    console.error('Error adding plant:', error)

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
          class="col-span-2"
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
          class="col-span-2"
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
            <div class="flex gap-2">
              <AddVarietyModal @variety-added="onVarietyAdded">
                <UButton
                  icon="i-heroicons-plus-20-solid"
                  size="sm"
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
            class="w-full"
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

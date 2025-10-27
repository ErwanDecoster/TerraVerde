<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useVariety } from '~/composables/data/useVariety'
import type { VarietyData } from '~/types/variety'
import { VARIETY_CATEGORIES_FOR_SELECT } from '~/utils/plantCategories'

interface Props {
  variety: VarietyData
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'varietyUpdated', data: VarietyData): void
  (e: 'varietyDeleted', varietyId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { updateVariety, deleteVariety } = useVariety()

const showDeleteConfirmation = ref(false)

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  scientific_name: z
    .string()
    .max(150, 'Scientific name cannot exceed 150 characters')
    .optional(),
  harvest_period: z
    .string()
    .max(100, 'Harvest period cannot exceed 100 characters')
    .optional(),
  main_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color')
    .optional(),
  reference_url: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  category: z.enum(
    [
      'tree',
      'fruit_tree',
      'shrub',
      'flower',
      'climber',
      'vegetable',
      'grass',
      'other',
    ],
    {
      message: 'Category is required',
    },
  ),
})

export type EditVarietySchema = z.output<typeof schema>

const state = reactive<Partial<EditVarietySchema>>({
  name: props.variety.name,
  scientific_name: props.variety.scientific_name || '',
  harvest_period: props.variety.harvest_period || '',
  main_color: props.variety.main_color || '#009689',
  reference_url: props.variety.reference_url || '',
  category: props.variety.category,
})

const chip = computed(() => ({ backgroundColor: state.main_color }))

const loading = ref(false)
const deleting = ref(false)

const form = ref()

watch(
  () => props.variety,
  (newVariety) => {
    Object.assign(state, {
      name: newVariety.name,
      scientific_name: newVariety.scientific_name || '',
      harvest_period: newVariety.harvest_period || '',
      main_color: newVariety.main_color || '#22c55e',
      reference_url: newVariety.reference_url || '',
      category: newVariety.category,
    })
  },
  { deep: true },
)

async function onSubmit(event: FormSubmitEvent<EditVarietySchema>) {
  loading.value = true

  try {
    const validatedData = event.data

    const varietyData = await updateVariety(props.variety.id, {
      name: validatedData.name,
      scientific_name: validatedData.scientific_name || null,
      harvest_period: validatedData.harvest_period || null,
      main_color: validatedData.main_color || null,
      reference_url: validatedData.reference_url || null,
      category: validatedData.category,
    })

    emit('varietyUpdated', varietyData)
    open.value = false

    toast.add({
      title: 'Variety Updated',
      description: 'The variety has been successfully updated',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error updating variety:', error)

    toast.add({
      title: 'Error',
      description: 'An error occurred while updating the variety',
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
    await deleteVariety(props.variety.id)

    emit('varietyDeleted', props.variety.id)
    open.value = false
    showDeleteConfirmation.value = false

    toast.add({
      title: 'Variety Deleted',
      description: 'The variety has been successfully deleted',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error deleting variety:', error)

    toast.add({
      title: 'Error',
      description: 'An error occurred while deleting the variety',
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
    title="Edit Variety"
    description="Update the variety details below."
  >
    <UButton
      label="Edit Variety"
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
          label="Variety Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Enter variety name"
          />
        </UFormField>
        <UFormField
          label="Category"
          name="category"
          required
        >
          <USelect
            v-model="state.category"
            :items="VARIETY_CATEGORIES_FOR_SELECT.slice()"
            class="w-full"
            placeholder="Select category"
          />
        </UFormField>

        <UFormField
          label="Scientific Name"
          name="scientific_name"
        >
          <UInput
            v-model="state.scientific_name"
            class="w-full"
            placeholder="e.g., Solanum lycopersicum"
          />
        </UFormField>

        <UFormField
          label="Harvest Period"
          name="harvest_period"
        >
          <UInput
            v-model="state.harvest_period"
            class="w-full"
            placeholder="e.g., July - October"
          />
        </UFormField>

        <UFormField
          label="Reference URL"
          name="reference_url"
          class="col-span-2"
        >
          <UInput
            v-model="state.reference_url"
            class="w-full"
            placeholder="https://example.com/variety-info"
            type="url"
          />
        </UFormField>

        <UFormField
          label="Main Color"
          name="main_color"
          class="col-span-2"
          :ui="{ container: 'grid grid-cols-2 gap-4' }"
        >
          <UPopover>
            <UButton
              label="Choose color"
              class="w-full"
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

        <div class="flex gap-0.5">
          <UButton
            variant="ghost"
            :disabled="loading || deleting"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            form="edit-variety-form"
            :loading="loading"
            :disabled="loading || deleting || showDeleteConfirmation"
            icon="i-heroicons-check-20-solid"
            @click="form.submit()"
          >
            Update Variety
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

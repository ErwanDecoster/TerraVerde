<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import type { VarietyData } from '~/types/variety'
import { VARIETY_CATEGORIES_FOR_SELECT } from '~/utils/plantCategories'
import { z } from 'zod'
import { useVariety } from '~/composables/data/useVariety'

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'varietyAdded', data: VarietyData): void
}

const emit = defineEmits<Emits>()
const open = ref(false)
const toast = useToast()
const { addVariety } = useVariety()

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

export type VarietySchema = z.output<typeof schema>

const state = reactive<Partial<VarietySchema>>({
  name: '',
  scientific_name: '',
  harvest_period: '',
  main_color: '#009689',
  reference_url: '',
  category: 'flower',
})

const chip = computed(() => ({ backgroundColor: state.main_color }))

const loading = ref(false)

const form = ref()

async function onSubmit(event: FormSubmitEvent<VarietySchema>) {
  loading.value = true

  try {
    const validatedData = event.data

    const varietyData = await addVariety({
      name: validatedData.name,
      scientific_name: validatedData.scientific_name || null,
      harvest_period: validatedData.harvest_period || null,
      main_color: validatedData.main_color || null,
      reference_url: validatedData.reference_url || null,
      category: validatedData.category,
    })

    emit('varietyAdded', varietyData)

    toast.add({
      title: 'Variety Added',
      description: 'The variety has been successfully added',
      color: 'success',
    })

    open.value = false

    Object.assign(state, {
      name: '',
      scientific_name: '',
      harvest_period: '',
      main_color: '#22c55e',
      reference_url: '',
      category: 'flower',
    })
  }
  catch (error) {
    console.error('Error adding variety:', error)

    toast.add({
      title: 'Error',
      description: 'An error occurred while adding the variety',
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
    title="Add New Variety"
    description="Fill in the details below to add a new plant variety."
  >
    <UButton
      label="Add Variety"
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
          form="variety-form"
          :loading="loading"
          :disabled="loading"
          icon="i-heroicons-plus-20-solid"
          @click="form.submit()"
        >
          Add Variety
        </UButton>
      </div>
    </template>
  </UModal>
</template>

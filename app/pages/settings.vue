<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useSettings } from '~/composables/data/useSettings'
import type { SettingsData } from '~/types/settings'

const colorMode = useColorMode()

const { fetchMySettings, updateSettings } = useSettings()
const loading = ref(true)
const saving = ref(false)
const settings = ref<SettingsData | null>(null)

onMounted(async () => {
  try {
    settings.value = await fetchMySettings()
    if (settings.value) {
      Object.assign(state, {
        show_markers_letters: settings.value.show_markers_letters ?? false,
        default_color_theme: settings.value.default_color_theme ?? '',
        language: settings.value.language ?? '',
        preferred_units: settings.value.preferred_units ?? '',
        timezone: settings.value.timezone ?? '',
      })
    }
  }
  finally {
    loading.value = false
  }
})

const schema = z.object({
  show_markers_letters: z.boolean().optional(),
  default_color_theme: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  preferred_units: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
})
export type SettingsEditSchema = z.output<typeof schema>

const state = reactive<Partial<SettingsEditSchema>>({
  show_markers_letters: false,
  default_color_theme: '',
  language: '',
  preferred_units: '',
  timezone: '',
})

const form = ref()

async function onSubmit(e: FormSubmitEvent<SettingsEditSchema>) {
  if (!settings.value) return
  saving.value = true
  try {
    const d = e.data
    const updated = await updateSettings({
      show_markers_letters: d.show_markers_letters ?? null,
      default_color_theme: d.default_color_theme ?? null,
      language: d.language ?? null,
      preferred_units: d.preferred_units ?? null,
      timezone: d.timezone ?? null,
    })
    settings.value = updated
    if (
      updated.default_color_theme
      && ['system', 'light', 'dark'].includes(updated.default_color_theme)
    ) {
      colorMode.preference
        = updated.default_color_theme as typeof colorMode.preference
    }
    useToast().add({ title: 'Settings Updated', color: 'success' })
  }
  catch (err) {
    console.error(err)
    useToast().add({
      title: 'Error',
      description: 'Failed to update settings',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

const colorThemeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const languageOptions = [
  { value: 'fr-FR', label: 'Français' },
  { value: 'en-EN', label: 'English' },
]
const unitsOptions = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
]
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold mb-6">
      Settings
    </h1>
    <div
      v-if="loading"
      class="py-12 flex justify-center"
    >
      <div
        class="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600"
      />
    </div>
    <div
      v-else
      class="space-y-6"
    >
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="grid grid-cols-2 gap-4"
        @submit="onSubmit"
      >
        <UFormField
          name="show_markers_letters"
          label="Show Marker Letters"
          class="col-span-2"
        >
          <USwitch
            v-model="state.show_markers_letters"
            label="Display letters on markers"
          />
        </UFormField>
        <UFormField
          name="default_color_theme"
          label="Color Theme"
          class="col-span-1"
        >
          <USelect
            v-model="state.default_color_theme"
            :items="colorThemeOptions"
          />
        </UFormField>
        <UFormField
          name="language"
          label="Language"
          class="col-span-1"
        >
          <USelect
            v-model="state.language"
            :items="languageOptions"
          />
        </UFormField>
        <UFormField
          name="preferred_units"
          label="Units"
          class="col-span-1"
        >
          <USelect
            v-model="state.preferred_units"
            :items="unitsOptions"
          />
        </UFormField>
        <UFormField
          name="timezone"
          label="Timezone"
          class="col-span-1"
        >
          <UInput
            v-model="state.timezone"
            placeholder="Europe/Paris"
          />
        </UFormField>
      </UForm>
      <div class="flex justify-end col-span-2 mt-2">
        <UButton
          color="primary"
          icon="i-heroicons-check-20-solid"
          :loading="saving"
          :disabled="saving"
          @click="form.submit()"
        >
          Save Changes
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { z } from "zod";
import {
  DEFAULT_SHOW_REAL_PLANT_SIZE,
  DEFAULT_SHOW_SMALL_PLANTS_ON_TOP,
} from "~/types/settings";

const settingsStore = useSettingsStore();
const { settings, loading, saving } = storeToRefs(settingsStore);

onMounted(async () => {
  await settingsStore.fetchMySettings();
});

const schema = z.object({
  show_markers_letters: z.boolean().optional(),
  show_real_plant_size: z.boolean().optional(),
  show_small_plants_on_top: z.boolean().optional(),
  default_color_theme: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  preferred_units: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
});
export type SettingsEditSchema = z.output<typeof schema>;

const state = reactive<Partial<SettingsEditSchema>>({
  show_markers_letters: false,
  show_real_plant_size: DEFAULT_SHOW_REAL_PLANT_SIZE,
  show_small_plants_on_top: DEFAULT_SHOW_SMALL_PLANTS_ON_TOP,
  default_color_theme: "",
  language: "",
  preferred_units: "",
  timezone: "",
});

watch(
  settings,
  (value) => {
    if (!value) {
      return;
    }

    Object.assign(state, {
      show_markers_letters: value.show_markers_letters ?? false,
      show_real_plant_size:
        value.show_real_plant_size ?? DEFAULT_SHOW_REAL_PLANT_SIZE,
      show_small_plants_on_top:
        value.show_small_plants_on_top ?? DEFAULT_SHOW_SMALL_PLANTS_ON_TOP,
      default_color_theme: value.default_color_theme ?? "",
      language: value.language ?? "",
      preferred_units: value.preferred_units ?? "",
      timezone: value.timezone ?? "",
    });
  },
  { immediate: true },
);

const form = ref();

async function onSubmit(e: FormSubmitEvent<SettingsEditSchema>) {
  if (!settings.value) return;
  try {
    const d = e.data;
    await settingsStore.updateSettings({
      show_markers_letters: d.show_markers_letters ?? null,
      show_real_plant_size: d.show_real_plant_size ?? null,
      show_small_plants_on_top: d.show_small_plants_on_top ?? null,
      default_color_theme: d.default_color_theme ?? null,
      language: d.language ?? null,
      preferred_units: d.preferred_units ?? null,
      timezone: d.timezone ?? null,
    });
    useToast().add({ title: "Settings Updated", color: "success" });
  } catch (err) {
    console.error(err);
    useToast().add({
      title: "Error",
      description: "Failed to update settings",
      color: "error",
    });
  }
}

const colorThemeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const languageOptions = [
  { value: "fr-FR", label: "French" },
  { value: "en-EN", label: "English" },
];
const unitsOptions = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="mb-6 text-2xl font-semibold">Settings</h1>
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="border-primary-600 h-10 w-10 animate-spin rounded-full border-b-2"
      />
    </div>
    <div v-else class="space-y-6">
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
          name="show_real_plant_size"
          label="Use Real Plant Size"
          class="col-span-2"
        >
          <USwitch
            v-model="state.show_real_plant_size"
            label="Display each plant with its real saved size"
          />
        </UFormField>
        <UFormField
          name="show_small_plants_on_top"
          label="Render Small Plants Above"
          class="col-span-2"
        >
          <USwitch
            v-model="state.show_small_plants_on_top"
            label="Draw smaller plants above larger plants"
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
        <UFormField name="language" label="Language" class="col-span-1">
          <USelect v-model="state.language" :items="languageOptions" />
        </UFormField>
        <UFormField name="preferred_units" label="Units" class="col-span-1">
          <USelect v-model="state.preferred_units" :items="unitsOptions" />
        </UFormField>
        <UFormField name="timezone" label="Timezone" class="col-span-1">
          <UInput v-model="state.timezone" placeholder="Europe/Paris" />
        </UFormField>
      </UForm>
      <div class="col-span-2 mt-2 flex justify-end">
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

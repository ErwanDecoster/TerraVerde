import type { SettingsData, SettingsUpdateFormData } from "~/types/settings";

export const useSettingsStore = defineStore("settings", () => {
  const { $supabase } = useNuxtApp();
  const authStore = useAuthStore();

  const settings = ref<SettingsData | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const loadedUserId = ref<string | null>(null);

  const applyThemePreference = (nextSettings: SettingsData | null) => {
    if (!import.meta.client) {
      return;
    }

    const preference = nextSettings?.default_color_theme;

    if (!preference || !["system", "light", "dark"].includes(preference)) {
      return;
    }

    useColorMode().preference = preference as "system" | "light" | "dark";
  };

  const reset = () => {
    settings.value = null;
    loadedUserId.value = null;
    loading.value = false;
    saving.value = false;
  };

  const fetchMySettings = async (options?: {
    force?: boolean;
    applyTheme?: boolean;
  }) => {
    const userId = authStore.user?.id ?? null;

    if (!userId) {
      reset();
      return null;
    }

    const force = options?.force ?? false;
    const shouldApplyTheme = options?.applyTheme ?? true;

    if (!force && loadedUserId.value === userId && settings.value) {
      if (shouldApplyTheme) {
        applyThemePreference(settings.value);
      }

      return settings.value;
    }

    loading.value = true;

    try {
      const { data, error } = await $supabase
        .from("settings")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          settings.value = null;
          loadedUserId.value = userId;
          return null;
        }

        throw new Error(`Failed to fetch settings: ${error.message}`);
      }

      settings.value = data as SettingsData;
      loadedUserId.value = userId;

      if (shouldApplyTheme) {
        applyThemePreference(settings.value);
      }

      return settings.value;
    } finally {
      loading.value = false;
    }
  };

  const updateSettings = async (formData: SettingsUpdateFormData) => {
    const userId = authStore.user?.id ?? null;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    saving.value = true;

    try {
      const updateData = {
        show_markers_letters: formData.show_markers_letters ?? null,
        show_real_plant_size: formData.show_real_plant_size ?? null,
        show_small_plants_on_top: formData.show_small_plants_on_top ?? null,
        default_color_theme: formData.default_color_theme ?? null,
        language: formData.language ?? null,
        preferred_units: formData.preferred_units ?? null,
        timezone: formData.timezone ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await $supabase
        .from("settings")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update settings: ${error.message}`);
      }

      settings.value = data as SettingsData;
      loadedUserId.value = userId;
      applyThemePreference(settings.value);

      return settings.value;
    } finally {
      saving.value = false;
    }
  };

  return {
    settings,
    loading,
    saving,
    loadedUserId,
    fetchMySettings,
    updateSettings,
    applyThemePreference,
    reset,
  };
});

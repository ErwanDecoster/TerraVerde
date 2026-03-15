import type { AuthChangeEvent, User } from "@supabase/supabase-js";

export default defineNuxtPlugin(async () => {
  const { $supabase } = useNuxtApp();
  const authStore = useAuthStore();

  await authStore.initialize();

  $supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
    authStore.setUser((session?.user || null) as User | null);

    if (event === "SIGNED_OUT") {
      useGardensStore().reset();
      useGardenStore().resetCurrentGarden();
      usePlantsStore().reset();
      useVarietiesStore().reset();
      useTeamsStore().reset();
      useProfileStore().resetAll();
      useSettingsStore().reset();
    }

    if (event === "SIGNED_IN") {
      // Re-initialize settings for the newly signed-in user
      useSettingsStore().fetchMySettings({ force: true, applyTheme: true });
      useProfileStore().fetchCurrentProfile({ force: true });
    }
  });
});

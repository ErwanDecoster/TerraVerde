export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  const authStore = useAuthStore();
  const settingsStore = useSettingsStore();

  watch(
    () => authStore.user?.id ?? null,
    async (userId) => {
      if (!userId) {
        settingsStore.reset();
        return;
      }

      try {
        await settingsStore.fetchMySettings({ applyTheme: true });
      } catch (e) {
        console.warn("Failed to apply user settings", e);
      }
    },
    { immediate: true },
  );
});

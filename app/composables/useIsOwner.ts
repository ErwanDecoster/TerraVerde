import { ref, watchEffect, type Ref } from "vue";

/**
 * Composable to check if the current user is owner of a garden (via team membership/role)
 * Usage: const { isOwner, checkIsOwner } = useIsOwner(gardenId)
 */
export function useIsOwner(gardenId: string | Ref<string>) {
  const isOwner = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authStore = useAuthStore();
  const teamsStore = useTeamsStore();

  const resolveGardenId = () =>
    typeof gardenId === "string" ? gardenId : gardenId.value;

  const checkIsOwner = async () => {
    const id = resolveGardenId();
    isOwner.value = false;
    error.value = null;
    if (!id) return;
    if (!authStore.user) {
      await authStore.initialize();
      if (!authStore.user) return;
    }
    loading.value = true;
    try {
      isOwner.value = await teamsStore.isGardenOwner(id);
    } catch (e) {
      console.error("Error getting user:", e);
      error.value = "Failed to determine ownership";
    } finally {
      loading.value = false;
    }
  };

  // Auto-run whenever user or gardenId changes
  watchEffect(() => {
    if (
      (typeof gardenId === "string" ? gardenId : gardenId.value) &&
      authStore.user !== undefined
    ) {
      // Fire and forget; errors stored in error ref
      checkIsOwner();
    }
  });

  return { isOwner, checkIsOwner, loading, error };
}

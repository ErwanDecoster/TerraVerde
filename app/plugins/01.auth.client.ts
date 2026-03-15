import type { User } from "@supabase/supabase-js";

export default defineNuxtPlugin(async () => {
  const { $supabase } = useNuxtApp();
  const authStore = useAuthStore();

  await authStore.initialize();

  $supabase.auth.onAuthStateChange((_event, session) => {
    authStore.setUser((session?.user || null) as User | null);
  });
});

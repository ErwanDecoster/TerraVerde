import type { User } from "@supabase/supabase-js";
import { storeToRefs } from "pinia";

export const useAuth = () => {
  const authStore = useAuthStore();
  const { user, loading } = storeToRefs(authStore);

  return {
    user: readonly(user) as Readonly<Ref<User | null>>,
    loading: readonly(loading),
    getUser: authStore.getUser,
    logout: authStore.logout,
    login: authStore.login,
    register: authStore.register,
    resetPassword: authStore.resetPassword,
    updatePassword: authStore.updatePassword,
    isAuthenticated: computed(() => authStore.isAuthenticated),
  };
};

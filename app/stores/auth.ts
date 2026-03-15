import type { User } from "@supabase/supabase-js";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const { $supabase } = useNuxtApp();

  const user = ref<User | null>(null);
  const loading = ref(true);
  const initialized = ref(false);

  const setUser = (nextUser: User | null) => {
    user.value = nextUser;
  };

  const initialize = async () => {
    if (initialized.value) {
      return user.value;
    }

    loading.value = true;

    try {
      const { data } = await $supabase.auth.getUser();
      user.value = data.user;
      initialized.value = true;
      return data.user;
    } catch (error) {
      console.error("Error getting user:", error);
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const getUser = async () => {
    loading.value = true;

    try {
      const { data } = await $supabase.auth.getUser();
      user.value = data.user;
      initialized.value = true;
      return data.user;
    } catch (error) {
      console.error("Error getting user:", error);
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await $supabase.auth.signOut();
      user.value = null;
      initialized.value = false;
      await navigateTo("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      loading.value = true;
      const { data, error } = await $supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      user.value = data.user;
      initialized.value = true;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error };
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await $supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/password-reset?step=2`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await $supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      loading.value = true;
      const { data, error } = await $supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      initialized.value = true;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error };
    } finally {
      loading.value = false;
    }
  };

  const isAuthenticated = computed(() => Boolean(user.value));

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    setUser,
    initialize,
    getUser,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
  };
});

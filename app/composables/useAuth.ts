import type { User } from '@supabase/supabase-js'
import { supabaseClient } from "~/composables/supabase";

export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null);
  const loading = useState('auth.loading', () => true);

  const getUser = async () => {
    try {
      loading.value = true;
      const { data } = await supabaseClient.auth.getUser();
      user.value = data.user;
      return data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await supabaseClient.auth.signOut();
      user.value = null;
      await navigateTo('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      loading.value = true;
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      user.value = data.user;
      return { data, error: null };
    } catch (error: unknown) {
      return { data: null, error };
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset?step=2`,
      });
      console.error("error", error);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      console.log("error", error);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    getUser,
    logout,
    login,
    resetPassword,
    updatePassword,
    isAuthenticated: computed(() => !!user.value)
  };
};
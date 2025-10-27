import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const { $supabase } = useNuxtApp()

  const user = useState<User | null>('auth.user', () => null)
  const loading = useState('auth.loading', () => true)

  const getUser = async () => {
    try {
      loading.value = true
      const { data } = await $supabase.auth.getUser()
      user.value = data.user
      return data.user
    }
    catch (error) {
      console.error('Error getting user:', error)
      user.value = null
      return null
    }
    finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await $supabase.auth.signOut()
      user.value = null
      await navigateTo('/login')
    }
    catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      const { data, error } = await $supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      user.value = data.user
      return { data, error: null }
    }
    catch (error: unknown) {
      return { data: null, error }
    }
    finally {
      loading.value = false
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await $supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset?step=2`,
      })
      console.error('error', error)

      if (error) throw error

      return { error: null }
    }
    catch (error: unknown) {
      return { error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await $supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { error: null }
    }
    catch (error: unknown) {
      return { error }
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      loading.value = true
      const { data, error } = await $supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) throw error

      return { data, error: null }
    }
    catch (error: unknown) {
      return { data: null, error }
    }
    finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    getUser,
    logout,
    login,
    register,
    resetPassword,
    updatePassword,
    isAuthenticated: computed(() => !!user.value),
  }
}

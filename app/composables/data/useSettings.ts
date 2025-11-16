import type { SettingsData, SettingsUpdateFormData } from '~/types/settings'

export const useSettings = () => {
  const { $supabase } = useNuxtApp()

  const fetchMySettings = async (): Promise<SettingsData | null> => {
    const { user } = useAuth()
    if (!user.value) throw new Error('User not authenticated')
    const { data, error } = await $supabase
      .from('settings')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch settings: ${error.message}`)
    }
    return data as SettingsData
  }

  const updateSettings = async (formData: SettingsUpdateFormData): Promise<SettingsData> => {
    const { user } = useAuth()
    if (!user.value) throw new Error('User not authenticated')
    const updateData = {
      show_markers_letters: formData.show_markers_letters ?? null,
      default_color_theme: formData.default_color_theme ?? null,
      language: formData.language ?? null,
      preferred_units: formData.preferred_units ?? null,
      timezone: formData.timezone ?? null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await $supabase
      .from('settings')
      .update(updateData)
      .eq('id', user.value.id)
      .select()
      .single()
    if (error) throw new Error(`Failed to update settings: ${error.message}`)
    return data as SettingsData
  }

  return { fetchMySettings, updateSettings }
}

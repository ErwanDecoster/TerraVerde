import type { SettingsData } from '~/types/settings'
import { useSettings } from '~/composables/data/useSettings'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return
  const { user } = useAuth()
  const { fetchMySettings } = useSettings()
  const colorMode = useColorMode()
  const settingsRef = ref<SettingsData | null>(null)

  watch(user, async (u) => {
    if (!u) return
    try {
      const s = await fetchMySettings()
      settingsRef.value = s
      if (s && s.default_color_theme && ['system', 'light', 'dark'].includes(s.default_color_theme)) {
        colorMode.preference = s.default_color_theme as typeof colorMode.preference
      }
    }
    catch (e) {
      console.warn('Failed to apply user settings', e)
    }
  }, { immediate: true })
})

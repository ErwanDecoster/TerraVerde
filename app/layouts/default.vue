<script lang="ts" setup>
import type { ProfileData } from '~/types/profile'
import { useProfile } from '~/composables/data/useProfile'
import type { SettingsData } from '~/types/settings'
import { useSettings } from '~/composables/data/useSettings'

const { user, logout, loading } = useAuth()
const { fetchMyProfile } = useProfile()
const { fetchMySettings, updateSettings } = useSettings()
const currentProfile = ref<ProfileData | null>(null)
const currentSettings = ref<SettingsData | null>(null)
const colorMode = useColorMode()
let lastSavedTheme: string | null = null

const navigationItems = computed(() => [
  {
    label: 'My Gardens',
    to: '/gardens',
    icon: 'i-heroicons-home',
  },
  {
    label: 'Public Gardens',
    to: '/public-gardens',
    icon: 'i-heroicons-globe-alt',
  },
])

// Load user profile when user is available
watch(
  user,
  async (newUser) => {
    if (!newUser) {
      currentProfile.value = null
      currentSettings.value = null
      lastSavedTheme = null
      return
    }
    try {
      currentProfile.value = await fetchMyProfile()
    }
    catch (err) {
      console.log('No profile found for user', err)
      currentProfile.value = null
    }
    try {
      const s = await fetchMySettings()
      currentSettings.value = s
      if (
        s?.default_color_theme
        && ['system', 'light', 'dark'].includes(s.default_color_theme)
      ) {
        colorMode.preference
          = s.default_color_theme as typeof colorMode.preference
        lastSavedTheme = s.default_color_theme
      }
    }
    catch (e) {
      console.warn('Failed to load settings', e)
    }
  },
  { immediate: true },
)

watch(
  () => colorMode.preference,
  async (pref) => {
    if (!user.value || !currentSettings.value) return
    if (pref === lastSavedTheme) return
    lastSavedTheme = pref
    try {
      currentSettings.value = await updateSettings({
        default_color_theme: pref,
      })
    }
    catch (e) {
      console.warn('Failed to persist theme preference', e)
    }
  },
)

const avatarUrl = computed(() => currentProfile.value?.avatar_url || '')
</script>

<template>
  <UApp>
    <UHeader mode="slideover">
      <template #title>
        <NuxtLink
          to="/"
          class="hover:opacity-80"
        >
          <BrandLogo />
        </NuxtLink>
      </template>

      <UNavigationMenu
        v-if="user"
        :items="navigationItems"
        class="hidden lg:flex"
      />

      <template #right>
        <div class="flex items-center gap-3">
          <template v-if="loading && !user">
            <UButton to="/register">
              Get Started
            </UButton>
          </template>
          <template v-else>
            <div
              v-if="user"
              class="flex items-center gap-3"
            >
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: 'Profile',
                      icon: 'i-heroicons-user-circle',
                      to: '/profile',
                    },
                    {
                      label: 'Settings',
                      icon: 'i-heroicons-cog-6-tooth',
                      to: '/settings',
                    },
                  ],
                  [
                    {
                      label: 'Sign Out',
                      icon: 'i-heroicons-arrow-right-on-rectangle',
                      onSelect: logout,
                    },
                  ],
                ]"
              >
                <UAvatar
                  :alt="user.email"
                  icon="i-heroicons-user-circle"
                  class="cursor-pointer"
                  :src="avatarUrl"
                />
              </UDropdownMenu>
            </div>
          </template>
        </div>
      </template>

      <template #body>
        <UNavigationMenu
          v-if="user"
          :items="navigationItems"
          orientation="vertical"
          class="-mx-2.5 lg:hidden"
        />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <UFooter />
  </UApp>
</template>

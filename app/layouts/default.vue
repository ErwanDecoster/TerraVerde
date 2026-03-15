<script lang="ts" setup>
import { useColorMode } from "#imports";
import { storeToRefs } from "pinia";

const { user, logout, loading } = useAuth();
const profileStore = useProfileStore();
const settingsStore = useSettingsStore();
const { currentProfile } = storeToRefs(profileStore);
const { settings: currentSettings } = storeToRefs(settingsStore);
const colorMode = useColorMode();
let lastSavedTheme: string | null = null;

const navigationItems = computed(() => [
  {
    label: "My Gardens",
    to: "/gardens",
    icon: "i-heroicons-home",
  },
  {
    label: "Public Gardens",
    to: "/public-gardens",
    icon: "i-heroicons-globe-alt",
  },
]);

// Load user profile when user is available
watch(
  user,
  async (newUser) => {
    if (!newUser) {
      profileStore.resetCurrentProfile();
      lastSavedTheme = null;
      return;
    }

    try {
      await profileStore.fetchCurrentProfile();
    } catch (err) {
      console.log("No profile found for user", err);
    }
  },
  { immediate: true },
);

watch(
  currentSettings,
  (value) => {
    if (!value?.default_color_theme) {
      return;
    }

    lastSavedTheme = value.default_color_theme;
  },
  { immediate: true },
);

watch(
  () => colorMode.preference,
  async (pref) => {
    if (!user.value || !currentSettings.value) return;
    if (pref === lastSavedTheme) return;
    lastSavedTheme = pref;
    try {
      await settingsStore.updateSettings({
        default_color_theme: pref,
      });
    } catch (e) {
      console.warn("Failed to persist theme preference", e);
    }
  },
);

const avatarUrl = computed(() => currentProfile.value?.avatar_url || "");
</script>

<template>
  <UApp>
    <UHeader mode="slideover">
      <template #title>
        <NuxtLink to="/" class="hover:opacity-80">
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
            <UButton to="/register"> Get Started </UButton>
          </template>
          <template v-else>
            <div v-if="user" class="flex items-center gap-3">
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

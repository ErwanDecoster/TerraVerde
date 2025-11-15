<script lang="ts" setup>
import type { ProfileData } from "~/types/profile";
import { useProfile } from "~/composables/data/useProfile";

const { user, logout, loading } = useAuth();
const { fetchMyProfile, getAvatarPublicUrl } = useProfile();
const currentProfile = ref<ProfileData | null>(null);

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
    if (newUser) {
      try {
        currentProfile.value = await fetchMyProfile();
      } catch (error) {
        console.log("No profile found for user");
        currentProfile.value = null;
      }
    } else {
      currentProfile.value = null;
    }
  },
  { immediate: true }
);

const avatarUrl = computed(() => currentProfile.value?.avatar_url || "");
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="hover:opacity-80">
          <BrandLogo />
        </NuxtLink>
      </template>

      <ClientOnly>
        <UNavigationMenu
          v-if="user"
          :items="navigationItems"
          class="hidden md:flex"
        />
      </ClientOnly>

      <template #right>
        <UColorModeSelect />

        <ClientOnly>
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
        </ClientOnly>
      </template>

      <template #body>
        <ClientOnly>
          <UNavigationMenu
            v-if="user"
            :items="navigationItems"
            orientation="vertical"
            class="-mx-2.5 md:hidden"
          />
        </ClientOnly>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <UFooter />
  </UApp>
</template>

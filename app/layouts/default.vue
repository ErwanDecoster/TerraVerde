<script lang="ts" setup>
const { user, logout, loading } = useAuth()

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
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink
          to="/"
          class="hover:opacity-80"
        >
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
            <template v-if="loading">
              <USkeleton class="h-8 w-24" />
            </template>
            <template v-else>
              <UUser
                v-if="user"
                :name="
                  user.user_metadata?.first_name
                    + ' '
                    + user.user_metadata?.last_name
                "
              />
              <UButton
                v-if="user"
                @click="logout"
              >
                Sign Out
              </UButton>
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

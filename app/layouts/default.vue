<script lang="ts" setup>
const { user, logout, loading } = useAuth();
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <Logo />
      </template>

      <!-- <UNavigationMenu :items="items" /> -->

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
                  user.user_metadata?.first_name +
                  ' ' +
                  user.user_metadata?.last_name
                "
              />
              <UButton v-if="user" @click="logout">Sign Out</UButton>
            </template>
          </div>
        </ClientOnly>
      </template>

      <!-- <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template> -->
    </UHeader>

    <UMain class="px-4">
      <slot />
    </UMain>

    <UFooter />
  </UApp>
</template>

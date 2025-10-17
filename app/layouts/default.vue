<script lang="ts" setup>
const { user, logout, loading } = useAuth();
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <!-- <Logo class="h-6 w-auto" /> -->
      </template>

      <!-- <UNavigationMenu :items="items" /> -->

      <template #right>
        <UColorModeSelect />

        <template v-if="!loading">
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

        <USkeleton v-else class="h-8 w-24" />
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

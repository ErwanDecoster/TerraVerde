<script lang="ts" setup>
const { user } = useAuth()
definePageMeta({
  layout: 'home',
})
</script>

<template>
  <div class="grid md:grid-cols-2 gap-8 items-center h-screen">
    <div class="border border-accented rounded p-8 text-center">
      <h1>Welcome on TerraVerde</h1>
      <ClientOnly>
        <NuxtLink
          v-if="user"
          to="/gardens"
          as
        >
          <UButton>Go to gardens</UButton>
        </NuxtLink>
        <NuxtLink
          v-else
          to="/login"
          as
        >
          <UButton>Login</UButton>
        </NuxtLink>
      </ClientOnly>
    </div>
    <div>
      <p>Explore our features and get started!</p>
    </div>
  </div>
</template>

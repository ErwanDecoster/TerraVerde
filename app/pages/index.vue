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
        <div class="flex gap-2 justify-center mt-3">
          <UButton
            v-if="user"
            to="/gardens"
          >
            Go to gardens
          </UButton>
          <UButton
            v-else
            to="/login"
          >
            Login
          </UButton>
          <UButton to="/public-gardens">
            Explore Public Gardens
          </UButton>
        </div>
      </ClientOnly>
    </div>
    <div>
      <p>Explore our features and get started!</p>
    </div>
  </div>
</template>

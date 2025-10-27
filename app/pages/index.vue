<script lang="ts" setup>
const { user } = useAuth()
definePageMeta({
  layout: 'home',
})
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-200 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-900"
  >
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute top-10 left-10 w-20 h-20 bg-primary-500 rounded-full blur-xl"
        />
        <div
          class="absolute top-32 right-20 w-16 h-16 bg-primary-400 rounded-full blur-lg"
        />
        <div
          class="absolute bottom-20 left-1/4 w-24 h-24 bg-primary-600 rounded-full blur-xl"
        />
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <!-- Logo/Brand -->
          <div class="flex justify-center mb-8">
            <div
              class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg"
            >
              <UIcon
                name="i-heroicons-sparkles-20-solid"
                class="w-10 h-10 text-white"
              />
            </div>
          </div>

          <!-- Main Title -->
          <h1
            class="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent mb-6"
          >
            TerraVerde
          </h1>

          <!-- Subtitle -->
          <p class="text-xl md:text-2xl text-toned mb-4 max-w-3xl mx-auto">
            Design, manage, and share your dream garden
          </p>

          <p class="text-lg text-muted mb-12 max-w-2xl mx-auto">
            Create beautiful garden layouts, track your plants, and connect with
            fellow gardening enthusiasts in our vibrant community.
          </p>

          <!-- Action Buttons -->
          <ClientOnly>
            <div
              class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <UButton
                v-if="user"
                to="/gardens"
                size="xl"
                color="primary"
                class="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <UIcon
                  name="i-heroicons-home-20-solid"
                  class="size-5"
                />
                My Gardens
              </UButton>
              <UButton
                v-else
                to="/login"
                size="xl"
                color="primary"
                class="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <UIcon
                  name="i-heroicons-user-20-solid"
                  class="size-5"
                />
                Get Started
              </UButton>
              <UButton
                to="/public-gardens"
                size="xl"
                variant="outline"
                color="primary"
                class="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <UIcon
                  name="i-heroicons-globe-alt-20-solid"
                  class="size-5"
                />
                Explore Public Gardens
              </UButton>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-highlighted mb-4">
          Everything you need for garden planning
        </h2>
        <p class="text-lg text-toned max-w-2xl mx-auto">
          From design to harvest, TerraVerde provides all the tools you need to
          create and maintain your perfect garden.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <UCard
          class="hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg"
              >
                <UIcon
                  name="i-heroicons-map-20-solid"
                  class="w-8 h-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-xl font-semibold text-highlighted">
              Visual Garden Design
            </h3>
            <p class="text-toned">
              Create stunning garden layouts with our intuitive drag-and-drop
              interface. Plan your space like a pro.
            </p>
          </div>
        </UCard>

        <!-- Feature 2 -->
        <UCard
          class="hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl shadow-lg"
              >
                <UIcon
                  name="i-heroicons-sparkles-20-solid"
                  class="w-8 h-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-xl font-semibold text-highlighted">
              Plant Management
            </h3>
            <p class="text-toned">
              Track your plants' growth, health, and harvest times. Never miss
              important gardening tasks again.
            </p>
          </div>
        </UCard>

        <!-- Feature 3 -->
        <UCard
          class="hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg"
              >
                <UIcon
                  name="i-heroicons-users-20-solid"
                  class="w-8 h-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-xl font-semibold text-highlighted">
              Community Sharing
            </h3>
            <p class="text-toned">
              Share your garden designs with the community and get inspired by
              others' beautiful creations.
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="bg-default backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              1000+
            </div>
            <div class="text-toned">
              Gardens Created
            </div>
          </div>
          <div>
            <div class="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
              5000+
            </div>
            <div class="text-toned">
              Plants Tracked
            </div>
          </div>
          <div>
            <div class="text-3xl md:text-4xl font-bold text-primary-800 mb-2">
              500+
            </div>
            <div class="text-toned">
              Plant Varieties
            </div>
          </div>
          <div>
            <div class="text-3xl md:text-4xl font-bold text-primary-900 mb-2">
              200+
            </div>
            <div class="text-toned">
              Active Gardeners
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-highlighted mb-6">
          Ready to grow your dream garden?
        </h2>
        <p class="text-lg text-toned mb-8 max-w-2xl mx-auto">
          Join our community of passionate gardeners and start planning your
          perfect outdoor space today.
        </p>
        <ClientOnly>
          <UButton
            v-if="!user"
            to="/register"
            size="xl"
            color="primary"
            class="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <UIcon
              name="i-heroicons-rocket-launch-20-solid"
              class="w-5 h-5 mr-2"
            />
            Start Your Garden Journey
          </UButton>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

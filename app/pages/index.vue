<script lang="ts" setup>
const { user } = useAuth();
definePageMeta({
  layout: "home",
});
</script>

<template>
  <div
    class="via-primary-50 to-primary-200 dark:to-primary-900 min-h-screen bg-gradient-to-br from-white dark:from-neutral-950 dark:via-neutral-900"
  >
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="bg-primary-500 absolute top-10 left-10 h-20 w-20 rounded-full blur-xl"
        />
        <div
          class="bg-primary-400 absolute top-32 right-20 h-16 w-16 rounded-full blur-lg"
        />
        <div
          class="bg-primary-600 absolute bottom-20 left-1/4 h-24 w-24 rounded-full blur-xl"
        />
      </div>

      <div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="text-center">
          <!-- Logo/Brand -->
          <div class="mb-8 flex justify-center">
            <div
              class="from-primary-500 to-primary-600 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg"
            >
              <UIcon
                name="i-heroicons-sparkles-20-solid"
                class="h-10 w-10 text-white"
              />
            </div>
          </div>

          <!-- Main Title -->
          <h1
            class="from-primary-500 via-primary-600 to-primary-700 mb-6 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
          >
            TerraVerde
          </h1>

          <!-- Subtitle -->
          <p class="text-toned mx-auto mb-4 max-w-3xl text-xl md:text-2xl">
            Design, manage, and share your dream garden
          </p>

          <p class="text-muted mx-auto mb-12 max-w-2xl text-lg">
            Create beautiful garden layouts, track your plants, and connect with
            fellow gardening enthusiasts in our vibrant community.
          </p>

          <!-- Action Buttons -->
          <ClientOnly>
            <div
              class="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <UButton
                v-if="user"
                to="/gardens"
                size="xl"
                color="primary"
                class="shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <UIcon name="i-heroicons-home-20-solid" class="size-5" />
                My Gardens
              </UButton>
              <UButton
                v-else
                to="/login"
                size="xl"
                color="primary"
                class="shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <UIcon name="i-heroicons-user-20-solid" class="size-5" />
                Get Started
              </UButton>
              <UButton
                to="/public-gardens"
                size="xl"
                variant="outline"
                color="primary"
                class="shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <UIcon name="i-heroicons-globe-alt-20-solid" class="size-5" />
                Explore Public Gardens
              </UButton>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="mb-16 text-center">
        <h2 class="text-highlighted mb-4 text-3xl font-bold md:text-4xl">
          Everything you need for garden planning
        </h2>
        <p class="text-toned mx-auto max-w-2xl text-lg">
          From design to harvest, TerraVerde provides all the tools you need to
          create and maintain your perfect garden.
        </p>
      </div>

      <div class="grid gap-8 md:grid-cols-3">
        <!-- Feature 1 -->
        <UCard
          class="text-center transition-shadow duration-200 hover:shadow-lg"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="from-primary-500 to-primary-600 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg"
              >
                <UIcon
                  name="i-heroicons-map-20-solid"
                  class="h-8 w-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-highlighted text-xl font-semibold">
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
          class="text-center transition-shadow duration-200 hover:shadow-lg"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="from-primary-400 to-primary-700 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg"
              >
                <UIcon
                  name="i-heroicons-sparkles-20-solid"
                  class="h-8 w-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-highlighted text-xl font-semibold">
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
          class="text-center transition-shadow duration-200 hover:shadow-lg"
        >
          <template #header>
            <div class="flex justify-center">
              <div
                class="from-primary-600 to-primary-800 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg"
              >
                <UIcon
                  name="i-heroicons-users-20-solid"
                  class="h-8 w-8 text-white"
                />
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <h3 class="text-highlighted text-xl font-semibold">
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
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div>
            <div class="text-primary-600 mb-2 text-3xl font-bold md:text-4xl">
              1000+
            </div>
            <div class="text-toned">Gardens Created</div>
          </div>
          <div>
            <div class="text-primary-700 mb-2 text-3xl font-bold md:text-4xl">
              5000+
            </div>
            <div class="text-toned">Plants Tracked</div>
          </div>
          <div>
            <div class="text-primary-800 mb-2 text-3xl font-bold md:text-4xl">
              500+
            </div>
            <div class="text-toned">Plant Varieties</div>
          </div>
          <div>
            <div class="text-primary-900 mb-2 text-3xl font-bold md:text-4xl">
              200+
            </div>
            <div class="text-toned">Active Gardeners</div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-highlighted mb-6 text-3xl font-bold md:text-4xl">
          Ready to grow your dream garden?
        </h2>
        <p class="text-toned mx-auto mb-8 max-w-2xl text-lg">
          Join our community of passionate gardeners and start planning your
          perfect outdoor space today.
        </p>
        <ClientOnly>
          <UButton
            v-if="!user"
            to="/register"
            size="xl"
            color="primary"
            class="shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <UIcon
              name="i-heroicons-rocket-launch-20-solid"
              class="mr-2 h-5 w-5"
            />
            Start Your Garden Journey
          </UButton>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

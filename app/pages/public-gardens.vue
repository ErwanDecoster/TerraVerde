<script lang="ts" setup>
import { storeToRefs } from "pinia";
import type { GardenData } from "~/types/garden";

definePageMeta({
  middleware: [],
});

const gardensStore = useGardensStore();
const {
  publicGardens: gardens,
  loadingPublicGardens: loading,
  publicGardensError: error,
} = storeToRefs(gardensStore);

// Helper to derive a display name for the first team's first member ("owner" concept)
const gardenPrimaryMemberName = (garden: GardenData): string => {
  const firstTeam = garden.teams?.[0];
  if (!firstTeam) return "";
  const firstMember = firstTeam.teams_members?.[0];
  if (!firstMember) return "";
  const first = firstMember.profile?.first_name || "";
  const last = firstMember.profile?.last_name || "";
  return (first + " " + last).trim();
};

onMounted(async () => {
  try {
    await gardensStore.loadPublicGardens();
  } catch (err) {
    console.error("Error loading public gardens:", err);
  }
});
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-8">
      <h1 class="mb-2 text-4xl font-bold">Public Gardens</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Discover gardens shared by the community
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex min-h-64 items-center justify-center">
      <UIcon
        name="i-heroicons-arrow-path-20-solid"
        class="animate-spin text-4xl"
      />
      <span class="ml-2">Loading public gardens...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex min-h-64 items-center justify-center">
      <UAlert
        icon="i-heroicons-exclamation-triangle-20-solid"
        color="error"
        variant="subtle"
        title="Error"
        :description="error"
      />
    </div>

    <!-- Empty state -->
    <div v-else-if="gardens.length === 0" class="py-12 text-center">
      <UIcon
        name="i-heroicons-globe-alt-20-solid"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
        No public gardens yet
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Be the first to share your garden with the community!
      </p>
      <div class="mt-6">
        <UButton to="/gardens" icon="i-heroicons-plus-20-solid">
          Create Your Garden
        </UButton>
      </div>
    </div>

    <!-- Gardens grid -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="garden in gardens"
        :key="garden.id"
        class="overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      >
        <template #header>
          <div class="relative aspect-video overflow-hidden">
            <img
              :src="garden.background_image_url"
              :alt="garden.name"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div class="absolute top-2 right-2">
              <UBadge color="primary" variant="solid" size="xs">
                Public
              </UBadge>
            </div>
          </div>
        </template>

        <div class="space-y-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ garden.name }}
            </h3>
            <p
              v-if="gardenPrimaryMemberName(garden)"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ gardenPrimaryMemberName(garden) }} Garden
            </p>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              Community Garden
            </p>
          </div>

          <div class="pt-2">
            <UButton
              :to="`/garden/${garden.id}`"
              color="primary"
              variant="outline"
              block
            >
              <UIcon name="i-heroicons-eye-20-solid" class="h-4 w-4" />
              View Garden
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

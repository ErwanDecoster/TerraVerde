<template>
  <UModal
    v-model:open="isOpen"
    title="Plant Information"
    :description="`Details for ${plant.name}`"
  >
    <template #body>
      <div class="space-y-4">
        <div>
          <h4>
            {{ plant.name }}
          </h4>
          <p v-if="plant.description" class="text-muted text-sm">
            {{ plant.description }}
          </p>
        </div>

        <div class="bg-elevated rounded-lg p-4">
          <h5 class="font-medium">Variety</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="font-medium">Name:</span>
              <span class="text-muted ml-2">{{ plant.variety.name }}</span>
            </div>
            <div v-if="plant.variety.scientific_name">
              <span class="font-medium">Scientific Name:</span>
              <span class="text-muted ml-2 italic">{{
                plant.variety.scientific_name
              }}</span>
            </div>
            <div v-if="plant.variety.category">
              <span class="font-medium">Category:</span>
              <span class="text-muted ml-2">{{
                getCategoryLabel(plant.variety.category)
              }}</span>
            </div>
            <div v-if="plant.variety.main_color">
              <span class="font-medium">Color:</span>
              <div class="ml-2 inline-flex items-center">
                <div
                  class="mr-2 h-4 w-4 rounded-full border border-gray-300"
                  :style="{ backgroundColor: plant.variety.main_color }"
                />
                <span class="text-muted">{{ plant.variety.main_color }}</span>
              </div>
            </div>
            <div v-if="plant.variety.harvest_period">
              <span class="font-medium">Harvest Period:</span>
              <span class="text-muted ml-2">{{
                plant.variety.harvest_period
              }}</span>
            </div>
          </div>
          <div v-if="plant.variety.reference_url" class="mt-3">
            <UButton
              :to="plant.variety.reference_url"
              external
              target="_blank"
              color="primary"
              variant="outline"
              size="xs"
              icon="i-heroicons-arrow-top-right-on-square-20-solid"
            >
              Reference Link
            </UButton>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Status:</span>
            <UBadge
              :color="getStatusColor(plant.status)"
              variant="subtle"
              class="ml-2"
            >
              {{ getStatusLabel(plant.status) }}
            </UBadge>
          </div>
          <div>
            <span class="font-medium">Planted Date:</span>
            <span class="text-muted ml-2">{{
              formatDate(plant.planted_date)
            }}</span>
          </div>
          <div v-if="plant.height">
            <span class="font-medium">Height:</span>
            <span class="text-muted ml-2">{{ plant.height }}m</span>
          </div>
          <div v-if="plant.width">
            <span class="font-medium">Width:</span>
            <span class="text-muted ml-2">{{ plant.width }}m</span>
          </div>
        </div>

        <UAlert
          v-if="showBulkTip && (canManageHistory || canEdit)"
          color="info"
          variant="subtle"
          icon="i-heroicons-light-bulb-20-solid"
          title="Tip: Bulk mode"
          description="On the map, hold Shift and click multiple plants. Release Shift to open bulk actions for the selected plants."
        />

        <div class="bg-elevated rounded-lg p-4">
          <div class="mb-3 flex items-center justify-between">
            <h5 class="font-medium">History</h5>
            <div v-if="canManageHistory" class="flex items-center gap-2">
              <UButton
                size="xs"
                variant="outline"
                icon="i-heroicons-plus-20-solid"
                @click="showAddEventModal = true"
              >
                Add Event
              </UButton>
              <UButton
                size="xs"
                color="primary"
                variant="outline"
                icon="i-heroicons-photo-20-solid"
                @click="showAddPhotoModal = true"
              >
                Add Photo
              </UButton>
            </div>
          </div>

          <div v-if="eventsLoading" class="flex items-center gap-2 text-sm">
            <UIcon
              name="i-heroicons-arrow-path-20-solid"
              class="animate-spin"
            />
            <span>Loading history...</span>
          </div>

          <UAlert
            v-else-if="eventsError"
            color="error"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle-20-solid"
            title="Unable to load history"
            :description="eventsError"
          />

          <div v-else-if="plantEvents.length === 0" class="text-muted text-sm">
            No history yet
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="event in plantEvents"
              :key="event.id"
              class="bg-default rounded-md p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="getEventIcon(event.event_type)"
                    class="text-primary"
                  />
                  <span class="font-medium">
                    {{ getEventLabel(event.event_type) }}
                  </span>
                </div>
                <span class="text-muted text-xs">
                  {{ formatDateTime(event.event_date) }}
                </span>
              </div>

              <p v-if="event.title" class="text-sm font-medium">
                {{ event.title }}
              </p>
              <p v-if="event.notes" class="text-muted text-sm">
                {{ event.notes }}
              </p>

              <div
                v-if="
                  event.plant_event_photos && event.plant_event_photos.length
                "
                class="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3"
              >
                <a
                  v-for="photo in event.plant_event_photos"
                  :key="photo.id"
                  :href="photo.image_url"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    :src="photo.image_url"
                    alt=""
                    class="h-24 w-full rounded border object-cover"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-0.5">
        <UButton variant="ghost" @click="close"> Close </UButton>
        <UButton
          v-if="canEdit"
          color="primary"
          icon="i-heroicons-pencil-square-20-solid"
          @click="openEditModal"
        >
          Edit Plant
        </UButton>
      </div>
    </template>
  </UModal>

  <AddPlantEventModal
    :open="showAddEventModal"
    :plant="plant"
    @update:open="showAddEventModal = $event"
    @event-added="onEventAdded"
  />

  <AddPlantPhotoEventModal
    :open="showAddPhotoModal"
    :plant="plant"
    @update:open="showAddPhotoModal = $event"
    @event-added="onEventAdded"
  />
</template>

<script lang="ts" setup>
import AddPlantEventModal from "~/components/plant/AddPlantEventModal.vue";
import AddPlantPhotoEventModal from "~/components/plant/AddPlantPhotoEventModal.vue";
import { usePlant } from "~/composables/data/usePlant";
import type { PlantData, PlantEventData, PlantEventType } from "~/types/plant";
import { PLANT_EVENT_TYPES, PLANT_STATUSES } from "~/types/plant";
import { getCategoryLabel } from "~/utils/plantCategories";

interface Props {
  plant: PlantData;
  open: boolean;
  canEdit?: boolean;
  canManageHistory?: boolean;
  showBulkTip?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "edit-requested", plant: PlantData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { fetchPlantEvents } = usePlant();

const plantEvents = ref<PlantEventData[]>([]);
const eventsLoading = ref(false);
const eventsError = ref<string | null>(null);
const showAddEventModal = ref(false);
const showAddPhotoModal = ref(false);

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const loadEvents = async () => {
  if (!props.plant?.id) return;

  eventsLoading.value = true;
  eventsError.value = null;

  try {
    plantEvents.value = await fetchPlantEvents(props.plant.id);
  } catch (error) {
    console.error("Error loading plant events:", error);
    eventsError.value = "Failed to load plant history";
  } finally {
    eventsLoading.value = false;
  }
};

watch(
  () => ({
    open: isOpen.value,
    plantId: props.plant.id,
  }),
  ({ open }) => {
    if (open) {
      loadEvents();
    }
  },
  { immediate: true },
);

const getStatusLabel = (status: string) => {
  const statusInfo = PLANT_STATUSES.find((s) => s.value === status);
  return statusInfo?.label || status;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "planted":
      return "success";
    case "growing":
      return "primary";
    case "flowering":
      return "warning";
    case "fruiting":
      return "warning";
    case "harvested":
      return "success";
    case "dormant":
      return "neutral";
    case "dead":
      return "error";
    default:
      return "neutral";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEventLabel = (eventType: PlantEventType) => {
  return (
    PLANT_EVENT_TYPES.find((event) => event.value === eventType)?.label ||
    eventType
  );
};

const getEventIcon = (eventType: PlantEventType) => {
  return (
    PLANT_EVENT_TYPES.find((event) => event.value === eventType)?.icon ||
    "i-heroicons-clock-20-solid"
  );
};

const onEventAdded = (event: PlantEventData) => {
  plantEvents.value = [event, ...plantEvents.value];
};

const openEditModal = () => {
  emit("edit-requested", props.plant);
  isOpen.value = false;
};
</script>

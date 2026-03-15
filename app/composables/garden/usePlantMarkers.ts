import { storeToRefs } from "pinia";
import { computed, type Ref } from "vue";
import type { GardenData } from "~/types/garden";
import type { PlantData } from "~/types/plant";
import {
  DEFAULT_SHOW_REAL_PLANT_SIZE,
  DEFAULT_SHOW_SMALL_PLANTS_ON_TOP,
} from "~/types/settings";
import { metersToPixels } from "~/utils/coordinates";
import { getCategoryKey } from "~/utils/plantCategories";

export const usePlantMarkers = (
  plants: Ref<PlantData[]>,
  visibleCategories: Ref<string[]>,
  garden: Ref<GardenData>,
  pixelsPerMetersPreview?: Ref<number | null>,
) => {
  const settingsStore = useSettingsStore();
  const { settings: userSettings } = storeToRefs(settingsStore);

  const getPlantStatusStroke = (status: string) => {
    switch (status) {
      case "healthy":
        return "#00000000";
      case "sick":
        return "#f59e0b";
      case "dead":
        return "#ef4444";
      case "planted":
        return "#00000000";
      default:
        return "#6b7280";
    }
  };

  const getCategoryLetter = (category: string) => {
    return getCategoryKey(category);
  };

  const plantMarkers = computed(() => {
    if (!garden.value) return [];

    const basePixelsPerMeters = garden.value.pixels_per_meters || 1;
    const PixelsPerMeters =
      pixelsPerMetersPreview?.value ?? basePixelsPerMeters;
    const positionScaleRatio = PixelsPerMeters / basePixelsPerMeters;
    const userPref = userSettings.value?.show_markers_letters;
    const showMarkersLetters = userPref ?? false;
    const showRealPlantSize =
      userSettings.value?.show_real_plant_size ?? DEFAULT_SHOW_REAL_PLANT_SIZE;
    const showSmallPlantsOnTop =
      userSettings.value?.show_small_plants_on_top ??
      DEFAULT_SHOW_SMALL_PLANTS_ON_TOP;

    const markers = plants.value
      .filter((plant) =>
        visibleCategories.value.includes(plant.variety.category),
      )
      .map((plant) => {
        const pixelX = (plant.x_position ?? 0) * positionScaleRatio;
        const pixelY = (plant.y_position ?? 0) * positionScaleRatio;

        const displayWidthMeters = showRealPlantSize ? plant.width : 0.5;
        const minVisibleWidth = Math.max(displayWidthMeters, 0.7);

        const pixelWidth = metersToPixels(minVisibleWidth, PixelsPerMeters);
        const radius = Math.round(pixelWidth / 2);

        return {
          id: plant.id,
          plant: plant,
          name: `plant-${plant.id}`,
          showLetter: showMarkersLetters,
          config: {
            x: pixelX,
            y: pixelY,
            radius: radius,
            fill: plant.variety.main_color || "#ffffff",
            stroke: getPlantStatusStroke(plant.status),
            strokeWidth: 1,
            opacity: plant.status === "dead" ? 0.6 : 1,
          },
        };
      });

    markers.sort((a, b) => {
      const sizeA = a.config.radius;
      const sizeB = b.config.radius;
      return showSmallPlantsOnTop ? sizeB - sizeA : sizeA - sizeB;
    });

    return markers;
  });

  return {
    plantMarkers,
    getCategoryLetter,
    getPlantStatusStroke,
  };
};

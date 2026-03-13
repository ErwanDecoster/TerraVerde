import type { VarietyData } from "./variety";

export type PlantEventType =
  | "watering"
  | "pruning"
  | "fertilizing"
  | "care"
  | "photo"
  | "other";

export interface PlantEventPhotoData {
  id: string;
  plant_event_id: string;
  plant_id: string;
  image_path: string;
  image_url?: string;
  caption?: string | null;
  created_at: string;
}

export interface PlantEventData {
  id: string;
  plant_id: string;
  garden_id: string;
  event_type: PlantEventType;
  title: string;
  notes?: string | null;
  event_date: string;
  created_by: string;
  created_at: string;
  plant_event_photos?: PlantEventPhotoData[];
}

export interface PlantEventFormData {
  plant_id: string;
  garden_id: string;
  event_type: Exclude<PlantEventType, "photo">;
  title?: string;
  notes?: string;
  event_date: string;
}

export interface PlantPhotoEventFormData {
  plant_id: string;
  garden_id: string;
  file: File;
  caption?: string;
  notes?: string;
  event_date: string;
}

export interface PlantData {
  id: string;
  name: string;
  description: string;
  variety_id: number;
  variety: VarietyData;
  status: PlantStatus;
  planted_date: string;
  main_color: string;
  height: number;
  width: number;
  x_position?: number;
  y_position?: number;
  garden_id?: string;
  created_at: string;
  updated_at: string;
}

export type PlantStatus = "healthy" | "sick" | "dead" | "planted";

export interface PlantFormData {
  name: string;
  description: string;
  variety_id: number;
  status: PlantStatus;
  planted_date: string;
  height: number;
  width: number;
  x_position?: number;
  y_position?: number;
  garden_id?: string;
}

export interface PlantUpdateFormData {
  name: string;
  description: string;
  variety_id: number;
  status: PlantStatus;
  planted_date: string;
  height: number;
  width: number;
  x_position?: number;
  y_position?: number;
  garden_id?: string;
}

export const PLANT_STATUSES = [
  { value: "healthy", label: "Healthy", color: "success" },
  { value: "sick", label: "Sick", color: "warning" },
  { value: "dead", label: "Dead", color: "error" },
  { value: "planted", label: "Planted", color: "info" },
] as const;

export const PLANT_EVENT_TYPES: Array<{
  value: PlantEventType;
  label: string;
  icon: string;
}> = [
  {
    value: "watering",
    label: "Watering",
    icon: "i-heroicons-beaker-20-solid",
  },
  {
    value: "pruning",
    label: "Pruning",
    icon: "i-heroicons-scissors-20-solid",
  },
  {
    value: "fertilizing",
    label: "Fertilizing",
    icon: "i-heroicons-sparkles-20-solid",
  },
  {
    value: "care",
    label: "Care",
    icon: "i-heroicons-heart-20-solid",
  },
  {
    value: "photo",
    label: "Photo",
    icon: "i-heroicons-photo-20-solid",
  },
  {
    value: "other",
    label: "Other",
    icon: "i-heroicons-chat-bubble-left-right-20-solid",
  },
];

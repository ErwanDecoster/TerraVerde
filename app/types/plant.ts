import type { VarietyData } from "./variety";

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

import { useStorageBucket } from "~/composables/data/useStorageBucket";
import type {
  PlantBulkHistoryFormData,
  PlantBulkUpdateFormData,
  PlantData,
  PlantEventData,
  PlantEventFormData,
  PlantEventType,
  PlantPhotoEventFormData,
  PlantFormData,
  PlantUpdateFormData,
} from "~/types/plant";

export const usePlant = () => {
  const { $supabase } = useNuxtApp();
  const { user } = useAuth();
  const { uploadFile, removeFile, getPublicUrl } = useStorageBucket();
  const PLANT_PICTURE_BUCKET = "plant-picture";

  /**
   * Create a new plant in the database
   */
  const createPlant = async (plantData: {
    id: string;
    name: string;
    description: string;
    variety_id: number;
    status: string;
    planted_date: string;
    main_color?: string;
    height: number;
    width: number;
    x_position?: number;
    y_position?: number;
    garden_id?: string;
  }) => {
    const { data, error } = await $supabase
      .from("plants")
      .insert(plantData)
      .select(
        `*,
        variety(
          *
        )`,
      )
      .single();

    if (error) {
      throw new Error(`Failed to create plant: ${error.message}`);
    }

    return data;
  };

  /**
   * Add a new plant
   */
  const addPlant = async (formData: PlantFormData): Promise<PlantData> => {
    const uuid = crypto.randomUUID();

    const plantDbData = {
      id: uuid,
      name: formData.name,
      description: formData.description,
      variety_id: formData.variety_id,
      status: formData.status,
      planted_date: formData.planted_date,
      height: formData.height,
      width: formData.width,
      x_position: formData.x_position,
      y_position: formData.y_position,
      garden_id: formData.garden_id,
    };

    const createdPlant = await createPlant(plantDbData);
    return createdPlant;
  };

  /**
   * Fetch all plants
   */
  const fetchPlants = async (gardenId: string): Promise<PlantData[]> => {
    const { data, error } = await $supabase
      .from("plants")
      .select(
        `
        *,
        variety(
          *
        )
      `,
      )
      .eq("garden_id", gardenId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch plants: ${error.message}`);
    }

    return data || [];
  };

  /**
   * Fetch a single plant by ID
   */
  const fetchPlantById = async (plantId: string): Promise<PlantData | null> => {
    const { data, error } = await $supabase
      .from("plants")
      .select(
        `*,
        variety(
          *
        )`,
      )
      .eq("id", plantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch plant: ${error.message}`);
    }

    return data;
  };

  /**
   * Update an existing plant
   */
  const updatePlant = async (
    plantId: string,
    formData: PlantUpdateFormData,
  ): Promise<PlantData> => {
    const plantDbData = {
      name: formData.name,
      description: formData.description,
      variety_id: formData.variety_id,
      status: formData.status,
      planted_date: formData.planted_date,
      height: formData.height,
      width: formData.width,
      x_position: formData.x_position,
      y_position: formData.y_position,
      garden_id: formData.garden_id,
    };

    const { data, error } = await $supabase
      .from("plants")
      .update(plantDbData)
      .eq("id", plantId)
      .select(
        `*,
        variety(
          *
        )`,
      )
      .single();

    if (error) {
      throw new Error(`Failed to update plant: ${error.message}`);
    }

    return data;
  };

  /**
   * Delete a plant
   */
  const deletePlant = async (plantId: string) => {
    const { error } = await $supabase.from("plants").delete().eq("id", plantId);

    if (error) {
      throw new Error(`Failed to delete plant: ${error.message}`);
    }
  };

  /**
   * Add multiple plants in bulk
   */
  const addMultiplePlants = async (
    plantsData: PlantFormData[],
  ): Promise<PlantData[]> => {
    const plantsDbData = plantsData.map((plantData) => ({
      id: crypto.randomUUID(),
      name: plantData.name,
      description: plantData.description,
      variety_id: plantData.variety_id,
      status: plantData.status,
      planted_date: plantData.planted_date,
      main_color: plantData.main_color,
      height: plantData.height,
      width: plantData.width,
      x_position: plantData.x_position,
      y_position: plantData.y_position,
      garden_id: plantData.garden_id,
    }));

    const { data, error } = await $supabase.from("plants").insert(plantsDbData)
      .select(`*,
        variety(
          *
        )`);

    if (error) {
      throw new Error(`Failed to create plants: ${error.message}`);
    }

    return data || [];
  };

  const getPlantPicturePublicUrl = (imagePath: string) => {
    return getPublicUrl(PLANT_PICTURE_BUCKET, imagePath);
  };

  const getDefaultEventTitle = (eventType: PlantEventType) => {
    switch (eventType) {
      case "watering":
        return "Watering";
      case "pruning":
        return "Pruning";
      case "fertilizing":
        return "Fertilizing";
      case "care":
        return "Care";
      case "photo":
        return "Photo added";
      default:
        return "Other";
    }
  };

  const normalizeEventTitle = (
    title: string | undefined,
    eventType: PlantEventType,
  ) => {
    const trimmed = title?.trim();
    return trimmed && trimmed.length > 0
      ? trimmed
      : getDefaultEventTitle(eventType);
  };

  const fetchPlantEvents = async (
    plantId: string,
  ): Promise<PlantEventData[]> => {
    const { data, error } = await $supabase
      .from("plant_events")
      .select(
        `
        *,
        plant_event_photos(*)
      `,
      )
      .eq("plant_id", plantId)
      .order("event_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch plant events: ${error.message}`);
    }

    return (data || []).map((event) => ({
      ...event,
      plant_event_photos: (event.plant_event_photos || []).map(
        (photo: { image_path: string }) => ({
          ...photo,
          image_url: getPlantPicturePublicUrl(photo.image_path),
        }),
      ),
    }));
  };

  const addPlantEvent = async (
    formData: PlantEventFormData,
  ): Promise<PlantEventData> => {
    if (!user.value) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await $supabase
      .from("plant_events")
      .insert({
        plant_id: formData.plant_id,
        garden_id: formData.garden_id,
        event_type: formData.event_type,
        title: normalizeEventTitle(formData.title, formData.event_type),
        notes: formData.notes || null,
        event_date: formData.event_date,
        created_by: user.value.id,
      })
      .select(
        `
        *,
        plant_event_photos(*)
      `,
      )
      .single();

    if (error) {
      throw new Error(`Failed to add plant event: ${error.message}`);
    }

    return {
      ...data,
      plant_event_photos: (data.plant_event_photos || []).map(
        (photo: { image_path: string }) => ({
          ...photo,
          image_url: getPlantPicturePublicUrl(photo.image_path),
        }),
      ),
    };
  };

  const uploadPlantEventPhoto = async (file: File, path: string) => {
    return uploadFile(PLANT_PICTURE_BUCKET, path, file);
  };

  const addPlantPhotoEvent = async (
    formData: PlantPhotoEventFormData,
  ): Promise<PlantEventData> => {
    if (!user.value) {
      throw new Error("User not authenticated");
    }

    const fileExtension = formData.file.name.split(".").pop() || "jpg";
    const filePath = `${formData.garden_id}/${formData.plant_id}/${crypto.randomUUID()}.${fileExtension}`;

    let uploadedImagePath: string | null = null;

    try {
      const uploadResult = await uploadPlantEventPhoto(formData.file, filePath);
      uploadedImagePath = uploadResult.path;

      const { data: eventData, error: eventError } = await $supabase
        .from("plant_events")
        .insert({
          plant_id: formData.plant_id,
          garden_id: formData.garden_id,
          event_type: "photo",
          title: "Photo added",
          notes: formData.notes || null,
          event_date: formData.event_date,
          created_by: user.value.id,
        })
        .select()
        .single();

      if (eventError) {
        throw new Error(`Failed to add photo event: ${eventError.message}`);
      }

      const { error: photoError } = await $supabase
        .from("plant_event_photos")
        .insert({
          plant_event_id: eventData.id,
          plant_id: formData.plant_id,
          image_path: uploadResult.path,
          caption: formData.caption || null,
        });

      if (photoError) {
        throw new Error(`Failed to link photo to event: ${photoError.message}`);
      }

      const { data, error } = await $supabase
        .from("plant_events")
        .select(
          `
          *,
          plant_event_photos(*)
        `,
        )
        .eq("id", eventData.id)
        .single();

      if (error) {
        throw new Error(
          `Failed to fetch created photo event: ${error.message}`,
        );
      }

      return {
        ...data,
        plant_event_photos: (data.plant_event_photos || []).map(
          (photo: { image_path: string }) => ({
            ...photo,
            image_url: getPlantPicturePublicUrl(photo.image_path),
          }),
        ),
      };
    } catch (error) {
      if (uploadedImagePath) {
        await removeFile(PLANT_PICTURE_BUCKET, uploadedImagePath);
      }
      throw error;
    }
  };

  const updatePlantsBulk = async (
    plantIds: string[],
    patch: PlantBulkUpdateFormData,
  ): Promise<PlantData[]> => {
    if (plantIds.length === 0) return [];

    const updatePayload = Object.fromEntries(
      Object.entries({
        variety_id: patch.variety_id,
        planted_date: patch.planted_date,
        height: patch.height,
        width: patch.width,
      }).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(updatePayload).length === 0) return [];

    const { data, error } = await $supabase
      .from("plants")
      .update(updatePayload)
      .in("id", plantIds)
      .select(
        `
        *,
        variety(
          *
        )
      `,
      );

    if (error) {
      throw new Error(`Failed to update plants in bulk: ${error.message}`);
    }

    return data || [];
  };

  const addPlantEventsBulk = async (
    plantIds: string[],
    gardenId: string,
    payload: PlantBulkHistoryFormData,
  ): Promise<PlantEventData[]> => {
    if (!user.value) {
      throw new Error("User not authenticated");
    }

    if (plantIds.length === 0) return [];

    const rows = plantIds.map((plantId) => ({
      plant_id: plantId,
      garden_id: gardenId,
      event_type: payload.event_type,
      title: normalizeEventTitle(payload.title, payload.event_type),
      notes: payload.notes || null,
      event_date: payload.event_date,
      created_by: user.value!.id,
    }));

    const { data, error } = await $supabase
      .from("plant_events")
      .insert(rows)
      .select(
        `
        *,
        plant_event_photos(*)
      `,
      );

    if (error) {
      throw new Error(`Failed to add bulk history events: ${error.message}`);
    }

    return (data || []).map((event) => ({
      ...event,
      plant_event_photos: (event.plant_event_photos || []).map(
        (photo: { image_path: string }) => ({
          ...photo,
          image_url: getPlantPicturePublicUrl(photo.image_path),
        }),
      ),
    }));
  };

  return {
    addPlant,
    addMultiplePlants,
    updatePlant,
    fetchPlants,
    fetchPlantById,
    deletePlant,
    fetchPlantEvents,
    addPlantEvent,
    addPlantPhotoEvent,
    updatePlantsBulk,
    addPlantEventsBulk,
    uploadPlantEventPhoto,
    getPlantPicturePublicUrl,
  };
};

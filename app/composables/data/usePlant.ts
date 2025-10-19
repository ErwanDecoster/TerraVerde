import type { PlantData, PlantFormData, PlantUpdateFormData } from '~/types/plant'

export const usePlant = () => {
  const { $supabase } = useNuxtApp()

  /**
   * Create a new plant in the database
   */
  const createPlant = async (plantData: {
    id: string
    name: string
    description: string
    category: string
    status: string
    planted_date: string
    main_color: string
    height: number
    width: number
    x_position?: number
    y_position?: number
    garden_id?: string
  }) => {
    const { data, error } = await $supabase
      .from('plants')
      .insert(plantData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create plant: ${error.message}`)
    }

    return data
  }

  /**
   * Add a new plant
   */
  const addPlant = async (formData: PlantFormData): Promise<PlantData> => {
    const uuid = crypto.randomUUID()

    try {
      // Create plant in database
      const plantDbData = {
        id: uuid,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        planted_date: formData.planted_date,
        main_color: formData.main_color,
        height: formData.height,
        width: formData.width,
        x_position: formData.x_position,
        y_position: formData.y_position,
        garden_id: formData.garden_id,
      }

      const createdPlant = await createPlant(plantDbData)
      return createdPlant
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Fetch all plants
   */
  const fetchPlants = async (gardenId: string): Promise<PlantData[]> => {
    const { data, error } = await $supabase
      .from('plants')
      .select('*')
      .eq('garden_id', gardenId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch plants: ${error.message}`)
    }

    return data || []
  }

  /**
   * Fetch a single plant by ID
   */
  const fetchPlantById = async (plantId: string): Promise<PlantData | null> => {
    const { data, error } = await $supabase
      .from('plants')
      .select('*')
      .eq('id', plantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to fetch plant: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing plant
   */
  const updatePlant = async (
    plantId: string,
    formData: PlantUpdateFormData,
  ): Promise<PlantData> => {
    try {
      // Update plant in database
      const plantDbData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        planted_date: formData.planted_date,
        main_color: formData.main_color,
        height: formData.height,
        width: formData.width,
        x_position: formData.x_position,
        y_position: formData.y_position,
        garden_id: formData.garden_id,
      }

      const { data, error } = await $supabase
        .from('plants')
        .update(plantDbData)
        .eq('id', plantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update plant: ${error.message}`)
      }

      return data
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Delete a plant
   */
  const deletePlant = async (plantId: string) => {
    // Delete from database
    const { error } = await $supabase
      .from('plants')
      .delete()
      .eq('id', plantId)

    if (error) {
      throw new Error(`Failed to delete plant: ${error.message}`)
    }
  }

  return {
    addPlant,
    updatePlant,
    fetchPlants,
    fetchPlantById,
    deletePlant,
  }
}

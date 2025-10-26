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
    variety_id: number
    status: string
    planted_date: string
    main_color?: string
    height: number
    width: number
    x_position?: number
    y_position?: number
    garden_id?: string
  }) => {
    const { data, error } = await $supabase
      .from('plants')
      .insert(plantData)
      .select(`*,
        variety(
          *
        )`)
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
    }

    const createdPlant = await createPlant(plantDbData)
    return createdPlant
  }

  /**
   * Fetch all plants
   */
  const fetchPlants = async (gardenId: string): Promise<PlantData[]> => {
    const { data, error } = await $supabase
      .from('plants')
      .select(`
        *,
        variety(
          *
        )
      `)
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
      .select(`*,
        variety(
          *
        )`)
      .eq('id', plantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
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
    }

    const { data, error } = await $supabase
      .from('plants')
      .update(plantDbData)
      .eq('id', plantId)
      .select(`*,
        variety(
          *
        )`)
      .single()

    if (error) {
      throw new Error(`Failed to update plant: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a plant
   */
  const deletePlant = async (plantId: string) => {
    const { error } = await $supabase
      .from('plants')
      .delete()
      .eq('id', plantId)

    if (error) {
      throw new Error(`Failed to delete plant: ${error.message}`)
    }
  }

  /**
   * Add multiple plants in bulk
   */
  const addMultiplePlants = async (plantsData: PlantFormData[]): Promise<PlantData[]> => {
    const plantsDbData = plantsData.map(plantData => ({
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
    }))

    const { data, error } = await $supabase
      .from('plants')
      .insert(plantsDbData)
      .select(`*,
        variety(
          *
        )`)

    if (error) {
      throw new Error(`Failed to create plants: ${error.message}`)
    }

    return data || []
  }

  return {
    addPlant,
    addMultiplePlants,
    updatePlant,
    fetchPlants,
    fetchPlantById,
    deletePlant,
  }
}

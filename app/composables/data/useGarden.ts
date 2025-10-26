import type { GardenData, GardenFormData, GardenUpdateFormData } from '~/types/garden'

export const useGarden = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()

  /**
   * Upload an image to Supabase storage
   */
  const uploadGardenImage = async (file: File, fileName: string) => {
    const { data, error } = await $supabase.storage
      .from('maps')
      .upload(fileName, file)

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`)
    }

    return data
  }

  /**
   * Remove an image from Supabase storage
   */
  const removeGardenImage = async (path: string) => {
    const { error } = await $supabase.storage
      .from('maps')
      .remove([path])

    if (error) {
      console.warn('Failed to remove image:', error)
    }
  }

  /**
   * Get the public URL for an image
   */
  const getImagePublicUrl = (imagePath: string) => {
    const projectId = config.public.supabaseProjectId
    const bucket = 'maps'
    return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${imagePath}`
  }

  /**
   * Create a new garden in the database
   */
  const createGarden = async (gardenData: {
    id: string
    name: string
    x_position: number
    y_position: number
    background_image_url: string
    image_width: number
    image_height: number
    pixels_per_meters: number
    is_public: boolean
  }) => {
    const { data, error } = await $supabase
      .from('garden_config')
      .insert(gardenData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create garden: ${error.message}`)
    }

    return data
  }

  /**
   * Add a new garden with image upload and database insertion
   */
  const addGarden = async (formData: GardenFormData): Promise<GardenData> => {
    const uuid = crypto.randomUUID()
    let uploadedImagePath: string | null = null

    try {
      const uploadResult = await uploadGardenImage(formData.backgroundImage, uuid)
      uploadedImagePath = uploadResult.path

      const gardenDbData = {
        id: uuid,
        name: formData.name,
        x_position: 0,
        y_position: 0,
        background_image_url: uploadResult.path,
        image_width: 0, // TODO: Get actual dimensions
        image_height: 0, // TODO: Get actual dimensions
        pixels_per_meters: formData.PixelsPerMeters,
        is_public: formData.isPublic,
      }

      const createdGarden = await createGarden(gardenDbData)

      return {
        ...createdGarden,
        background_image_url: getImagePublicUrl(uploadResult.path),
      }
    }
    catch (error) {
      if (uploadedImagePath) {
        await removeGardenImage(uploadedImagePath)
      }
      throw error
    }
  }

  /**
   * Fetch user's own gardens
   */
  const fetchMyGardens = async (): Promise<GardenData[]> => {
    const { user } = useAuth()
    if (!user.value) {
      throw new Error('User not authenticated')
    }
    const { data, error } = await $supabase
      .from('garden_config')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch gardens: ${error.message}`)
    }

    return data.map(garden => ({
      ...garden,
      background_image_url: getImagePublicUrl(garden.background_image_url),
    }))
  }

  /**
   * Fetch all public gardens from all users
   */
  const fetchPublicGardens = async (): Promise<GardenData[]> => {
    const { data, error } = await $supabase
      .from('garden_config')
      .select(`*`)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch public gardens: ${error.message}`)
    }

    return data.map(garden => ({
      ...garden,
      background_image_url: getImagePublicUrl(garden.background_image_url),
    }))
  }

  /**
   * Fetch a single garden by ID
   */
  const fetchGardenById = async (gardenId: string): Promise<GardenData | null> => {
    const { data, error } = await $supabase
      .from('garden_config')
      .select('*')
      .eq('id', gardenId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch garden: ${error.message}`)
    }

    return {
      ...data,
      background_image_url: getImagePublicUrl(data.background_image_url),
    }
  }

  /**
   * Update an existing garden
   */
  const updateGarden = async (
    gardenId: string,
    formData: GardenUpdateFormData,
    currentImagePath?: string,
  ): Promise<GardenData> => {
    let uploadedImagePath: string | null = null
    let shouldCleanupOldImage = false

    try {
      const hasNewImage = !!formData.backgroundImage
      let imagePath = currentImagePath || ''

      if (hasNewImage && formData.backgroundImage) {
        const uploadResult = await uploadGardenImage(formData.backgroundImage, `${gardenId}_updated_${Date.now()}`)
        uploadedImagePath = uploadResult.path
        imagePath = uploadResult.path
        shouldCleanupOldImage = true
      }

      const gardenDbData = {
        name: formData.name,
        x_position: 0,
        y_position: 0,
        pixels_per_meters: formData.PixelsPerMeters,
        is_public: formData.isPublic,
        ...(hasNewImage && { background_image_url: imagePath }),
      }

      const { data, error } = await $supabase
        .from('garden_config')
        .update(gardenDbData)
        .eq('id', gardenId)
        .select()
        .single()

      if (error) {
        if (uploadedImagePath) {
          await removeGardenImage(uploadedImagePath)
        }
        throw new Error(`Failed to update garden: ${error.message}`)
      }

      if (shouldCleanupOldImage && currentImagePath && currentImagePath !== imagePath) {
        await removeGardenImage(currentImagePath)
      }

      return {
        ...data,
        background_image_url: getImagePublicUrl(data.background_image_url),
      }
    }
    catch (error) {
      if (uploadedImagePath) {
        await removeGardenImage(uploadedImagePath)
      }
      throw error
    }
  }

  /**
   * Delete a garden and its associated image
   */
  const deleteGarden = async (gardenId: string, imagePath?: string) => {
    const { error } = await $supabase
      .from('garden_config')
      .delete()
      .eq('id', gardenId)

    if (error) {
      throw new Error(`Failed to delete garden: ${error.message}`)
    }

    if (imagePath) {
      await removeGardenImage(imagePath)
    }
  }

  return {
    addGarden,
    updateGarden,
    fetchMyGardens,
    fetchPublicGardens,
    fetchGardenById,
    deleteGarden,
    uploadGardenImage,
    removeGardenImage,
    getImagePublicUrl,
  }
}

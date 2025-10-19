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
    background_color: string
    background_image_url: string
    image_width: number
    image_height: number
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
      // Upload image
      const uploadResult = await uploadGardenImage(formData.backgroundImage, uuid)
      uploadedImagePath = uploadResult.path

      // Create garden in database
      const gardenDbData = {
        id: uuid,
        name: formData.name,
        x_position: formData.position.x,
        y_position: formData.position.y,
        background_color: formData.backgroundColor,
        background_image_url: uploadResult.path,
        image_width: 0, // TODO: Get actual dimensions
        image_height: 0, // TODO: Get actual dimensions
      }

      const createdGarden = await createGarden(gardenDbData)

      // Return garden data with public URL
      return {
        ...createdGarden,
        background_image_url: getImagePublicUrl(uploadResult.path),
      }
    }
    catch (error) {
      // Clean up uploaded image if database insertion failed
      if (uploadedImagePath) {
        await removeGardenImage(uploadedImagePath)
      }
      throw error
    }
  }

  /**
   * Fetch all gardens
   */
  const fetchGardens = async (): Promise<GardenData[]> => {
    const { data, error } = await $supabase
      .from('garden_config')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch gardens: ${error.message}`)
    }

    // Transform the data to include public URLs
    return data.map(garden => ({
      ...garden,
      background_image_url: getImagePublicUrl(garden.background_image_url),
    }))
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
      // Check if a new image was uploaded
      const hasNewImage = !!formData.backgroundImage
      let imagePath = currentImagePath || ''

      if (hasNewImage && formData.backgroundImage) {
        // Upload new image
        const uploadResult = await uploadGardenImage(formData.backgroundImage, `${gardenId}_updated_${Date.now()}`)
        uploadedImagePath = uploadResult.path
        imagePath = uploadResult.path
        shouldCleanupOldImage = true
      }

      // Update garden in database
      const gardenDbData = {
        name: formData.name,
        x_position: formData.position.x,
        y_position: formData.position.y,
        background_color: formData.backgroundColor,
        ...(hasNewImage && { background_image_url: imagePath }),
        // Keep existing dimensions for now
      }

      const { data, error } = await $supabase
        .from('garden_config')
        .update(gardenDbData)
        .eq('id', gardenId)
        .select()
        .single()

      if (error) {
        // Clean up uploaded image if database update failed
        if (uploadedImagePath) {
          await removeGardenImage(uploadedImagePath)
        }
        throw new Error(`Failed to update garden: ${error.message}`)
      }

      // Clean up old image if new one was uploaded successfully
      if (shouldCleanupOldImage && currentImagePath && currentImagePath !== imagePath) {
        await removeGardenImage(currentImagePath)
      }

      // Return updated garden data with public URL
      return {
        ...data,
        background_image_url: getImagePublicUrl(data.background_image_url),
      }
    }
    catch (error) {
      // Clean up uploaded image if update failed
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
    // Delete from database
    const { error } = await $supabase
      .from('garden_config')
      .delete()
      .eq('id', gardenId)

    if (error) {
      throw new Error(`Failed to delete garden: ${error.message}`)
    }

    // Clean up image if provided
    if (imagePath) {
      await removeGardenImage(imagePath)
    }
  }

  return {
    addGarden,
    updateGarden,
    fetchGardens,
    deleteGarden,
    uploadGardenImage,
    removeGardenImage,
    getImagePublicUrl,
  }
}

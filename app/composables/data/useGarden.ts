import type { GardenData, GardenFormData, GardenUpdateFormData } from '~/types/garden'
import { useTeam } from '~/composables/data/useTeam'

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
    background_image_url: string
    pixels_per_meters: number
    is_public: boolean
    variety_filter_mode: string
    description?: string | null
    zip_code?: string | null
    country?: string | null
    city?: string | null
    street_address?: string | null
  }) => {
    const { data, error } = await $supabase
      .from('gardens')
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
    const { createTeam, addTeamMember } = useTeam()
    const { user } = useAuth()

    try {
      const uploadResult = await uploadGardenImage(formData.backgroundImage, uuid)
      uploadedImagePath = uploadResult.path

      const gardenDbData = {
        id: uuid,
        name: formData.name,
        background_image_url: uploadResult.path,
        pixels_per_meters: formData.PixelsPerMeters,
        is_public: formData.isPublic,
        variety_filter_mode: formData.variety_filter_mode,
        description: formData.description ?? null,
        zip_code: formData.zip_code ?? null,
        country: formData.country ?? null,
        city: formData.city ?? null,
        street_address: formData.street_address ?? null,
      }

      const createdGarden = await createGarden(gardenDbData)

      // Create a team for this garden and add the current user as a member
      if (!user.value) throw new Error('User not authenticated')
      const team = await createTeam(createdGarden.id, `${createdGarden.name} Team`)
      console.log('team', team)

      await addTeamMember(team.id, user.value.id, 'owner')

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
    // Fetch gardens where the user is a member of a team
    const { data, error } = await $supabase
      .from('teams_members')
      .select(`
        team_id, 
        teams(
          id, 
          garden_id, 
          gardens(
            *,
            teams!inner (
              teams_members!inner (
                profile:profiles!inner(
                  id, first_name, last_name, avatar_url
                )
              )
            )
          )
        )
      `)
      .eq('user_id', user.value.id)

    if (error) {
      throw new Error(`Failed to fetch gardens: ${error.message}`)
    }

    // Flatten and filter out nulls
    type TeamsMembersRow = {
      teams?: {
        gardens?: GardenData
      }
    }
    const gardens: GardenData[] = (data as TeamsMembersRow[] || [])
      .map(row => row.teams?.gardens)
      .filter((g): g is GardenData => !!g)
      .map(g => ({
        ...g,
        background_image_url: getImagePublicUrl(g.background_image_url),
      }))

    // Optionally, sort by created_at descending
    gardens.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))

    return gardens
  }

  /**
   * Fetch all public gardens from all users
   */
  const fetchPublicGardens = async (): Promise<GardenData[]> => {
    const { data, error } = await $supabase
      .from('gardens')
      .select(`
      *,
      teams!inner (
        teams_members!inner (
          profile:profiles!inner(
            first_name, last_name, avatar_url
          )
        )
      )
    `)
      .eq('is_public', true)
      .eq('teams.teams_members.role', 'owner')
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
      .from('gardens')
      .select(`
        *,
        teams!inner (
          teams_members!inner (
            profile:profiles!inner(
              id, first_name, last_name, avatar_url
            )
          )
        )
      `)
      .eq('id', gardenId)
      .eq('teams.teams_members.role', 'owner')
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
        pixels_per_meters: formData.PixelsPerMeters,
        is_public: formData.isPublic,
        variety_filter_mode: formData.variety_filter_mode,
        description: formData.description ?? null,
        zip_code: formData.zip_code ?? null,
        country: formData.country ?? null,
        city: formData.city ?? null,
        street_address: formData.street_address ?? null,
        ...(hasNewImage && { background_image_url: imagePath }),
      }

      const { data, error } = await $supabase
        .from('gardens')
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
      .from('gardens')
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

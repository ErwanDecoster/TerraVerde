import type { ProfileData, ProfileUpdateFormData } from '~/types/profile'

export const useProfile = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()

  /**
   * Upload an avatar image to Supabase storage
   */
  const uploadAvatarImage = async (file: File, fileName: string) => {
    const { data, error } = await $supabase.storage
      .from('avatars')
      .upload(fileName, file)
    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`)
    }
    return data
  }

  /**
   * Remove an avatar image from Supabase storage
   */
  const removeAvatarImage = async (path: string) => {
    const { error } = await $supabase.storage
      .from('avatars')
      .remove([path])

    if (error) {
      console.warn('Failed to remove avatar:', error)
    }
  }

  /**
   * Get the public URL for an avatar image
   */
  const getAvatarPublicUrl = (imagePath: string) => {
    const projectId = config.public.supabaseProjectId
    const bucket = 'avatars'
    return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${imagePath}`
  }

  /**
   * Fetch the current user's profile
   */
  const fetchMyProfile = async (): Promise<ProfileData | null> => {
    const { user } = useAuth()
    if (!user.value) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await $supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return {
      ...data,
      avatar_url: data.avatar_url ? getAvatarPublicUrl(data.avatar_url) : null,
    }
  }

  /**
   * Fetch all public profiles
   */
  const fetchPublicProfiles = async (): Promise<ProfileData[]> => {
    const { data, error } = await $supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('first_name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch public profiles: ${error.message}`)
    }

    return data.map(profile => ({
      ...profile,
      avatar_url: profile.avatar_url ? getAvatarPublicUrl(profile.avatar_url) : null,
    }))
  }

  /**
   * Fetch a single profile by ID
   */
  const fetchProfileById = async (profileId: string): Promise<ProfileData | null> => {
    const { data, error } = await $supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return {
      ...data,
      avatar_url: data.avatar_url ? getAvatarPublicUrl(data.avatar_url) : null,
    }
  }

  /**
   * Update an existing profile
   */
  const updateProfile = async (
    formData: ProfileUpdateFormData,
    currentAvatarPath?: string,
  ): Promise<ProfileData> => {
    const { user } = useAuth()
    if (!user.value) throw new Error('User not authenticated')

    let uploadedImagePath: string | null = null
    let shouldCleanupOldImage = false

    try {
      const hasNewAvatar = !!formData.avatar_file
      let avatarPath = currentAvatarPath || null

      if (hasNewAvatar && formData.avatar_file) {
        const uploadResult = await uploadAvatarImage(formData.avatar_file, `${user.value.id}_avatar_${Date.now()}`)
        uploadedImagePath = uploadResult.path
        avatarPath = uploadResult.path
        shouldCleanupOldImage = true
      }

      const profileDbData = {
        first_name: formData.first_name ?? null,
        last_name: formData.last_name ?? null,
        bio: formData.bio ?? null,
        website: formData.website ?? null,
        is_public: formData.is_public ?? false,
        ...(hasNewAvatar && { avatar_url: avatarPath }),
      }

      const { data, error } = await $supabase
        .from('profiles')
        .update(profileDbData)
        .eq('id', user.value.id)
        .select()
        .single()

      if (error) {
        if (uploadedImagePath) {
          await removeAvatarImage(uploadedImagePath)
        }
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      if (shouldCleanupOldImage && currentAvatarPath && currentAvatarPath !== avatarPath) {
        await removeAvatarImage(currentAvatarPath)
      }

      return {
        ...data,
        avatar_url: data.avatar_url ? getAvatarPublicUrl(data.avatar_url) : null,
      }
    }
    catch (error) {
      if (uploadedImagePath) {
        await removeAvatarImage(uploadedImagePath)
      }
      throw error
    }
  }

  return {
    updateProfile,
    fetchMyProfile,
    fetchPublicProfiles,
    fetchProfileById,
    uploadAvatarImage,
    removeAvatarImage,
    getAvatarPublicUrl,
  }
}

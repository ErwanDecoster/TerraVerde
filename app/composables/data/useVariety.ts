import type { VarietyData, VarietyFormData } from '~/types/variety'
import type { VarietyFilterMode } from '~/types/garden'

export const useVariety = () => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const fetchVarieties = async (
    gardenId?: string,
    filterMode: VarietyFilterMode = 'garden',
  ): Promise<VarietyData[]> => {
    let query = $supabase.from('variety').select('*')

    switch (filterMode) {
      case 'garden':
        if (gardenId) {
          query = query.eq('garden_id', gardenId)
        }
        else {
          query = query.eq('is_public', true)
        }
        break

      case 'public':
        query = query.eq('is_public', true)
        break

      case 'all':
        if (gardenId && user.value) {
          query = query.or(`garden_id.eq.${gardenId},is_public.eq.true`)
        }
        else {
          query = query.eq('is_public', true)
        }
        break
    }

    const { data, error } = await query.order('name')

    if (error) {
      console.error('Error fetching varieties:', error)
      throw new Error(`Failed to fetch varieties: ${error.message}`)
    }

    return data || []
  }

  const fetchVarietyById = async (id: string): Promise<VarietyData | null> => {
    const { data, error } = await $supabase
      .from('variety')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching variety:', error)
      throw new Error(`Failed to fetch variety: ${error.message}`)
    }

    return data
  }

  const addVariety = async (varietyData: VarietyFormData): Promise<VarietyData> => {
    if (!user.value) throw new Error('User not authenticated')

    const dataToInsert = {
      ...varietyData,
      user_id: user.value.id,
      is_public: varietyData.is_public ?? false,
    }

    const { data, error } = await $supabase
      .from('variety')
      .insert([dataToInsert])
      .select()
      .single()

    if (error) {
      console.error('Error adding variety:', error)
      throw new Error(`Failed to add variety: ${error.message}`)
    }

    return data
  }

  const updateVariety = async (id: string, varietyData: Partial<VarietyFormData>): Promise<VarietyData> => {
    const { data, error } = await $supabase
      .from('variety')
      .update(varietyData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating variety:', error)
      throw new Error(`Failed to update variety: ${error.message}`)
    }

    return data
  }

  const deleteVariety = async (id: string): Promise<void> => {
    const { error } = await $supabase
      .from('variety')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting variety:', error)
      throw new Error(`Failed to delete variety: ${error.message}`)
    }
  }

  return {
    fetchVarieties,
    fetchVarietyById,
    addVariety,
    updateVariety,
    deleteVariety,
  }
}

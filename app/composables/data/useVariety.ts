import type { VarietyData, VarietyFormData } from '~/types/variety'

export const useVariety = () => {
  const { $supabase } = useNuxtApp()

  const fetchVarieties = async (): Promise<VarietyData[]> => {
    const { data, error } = await $supabase
      .from('variety')
      .select('*')
      .order('name')

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
    const { data, error } = await $supabase
      .from('variety')
      .insert([varietyData])
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

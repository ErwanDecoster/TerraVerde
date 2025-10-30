import { ref, watchEffect, type Ref } from 'vue'
import { useTeam } from '~/composables/data/useTeam'
import { useAuth } from '~/composables/useAuth'

/**
 * Composable to check if the current user is owner of a garden (via team membership/role)
 * Usage: const { isOwner, checkIsOwner } = useIsOwner(gardenId)
 */
export function useIsOwner(gardenId: string | Ref<string>) {
  const isOwner = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { user, getUser } = useAuth()
  const { fetchTeamsByGarden, fetchTeamMembers } = useTeam()

  const resolveGardenId = () => (typeof gardenId === 'string' ? gardenId : gardenId.value)

  const checkIsOwner = async () => {
    const id = resolveGardenId()
    isOwner.value = false
    error.value = null
    if (!id) return
    if (!user.value) {
      await getUser()
      if (!user.value) return
    }
    loading.value = true
    try {
      const teams = await fetchTeamsByGarden(id)
      for (const team of teams) {
        const members = await fetchTeamMembers(team.id)
        if (user.value && members.some(m => m.user_id === user.value!.id && m.role === 'owner')) {
          isOwner.value = true
          break
        }
      }
    }
    catch (e) {
      console.error('Error getting user:', e)
      error.value = 'Failed to determine ownership'
    }
    finally {
      loading.value = false
    }
  }

  // Auto-run whenever user or gardenId changes
  watchEffect(() => {
    if ((typeof gardenId === 'string' ? gardenId : gardenId.value) && user.value !== undefined) {
      // Fire and forget; errors stored in error ref
      checkIsOwner()
    }
  })

  return { isOwner, checkIsOwner, loading, error }
}

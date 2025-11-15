// import type { GardenData } from '~/types/garden'

import type { TeamData, TeamMemberData } from '~/types/team'

export const useTeam = () => {
  const { $supabase } = useNuxtApp()
  /**
     * Remove a team by id
     */
  const removeTeam = async (teamId: number) => {
    const { error } = await $supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
    if (error) throw new Error(`Failed to remove team: ${error.message}`)
  }

  /**
   * Create a team for a garden
   */
  const createTeam = async (gardenId: string, name?: string): Promise<TeamData> => {
    const { data, error } = await $supabase
      .from('teams')
      .insert({ garden_id: gardenId, name })
      .select()
      .single()
    if (error) throw new Error(`Failed to create team: ${error.message}`)
    return data
  }

  /**
   * Add a member to a team
   */
  const addTeamMember = async (teamId: number, userId: string, role?: string): Promise<TeamMemberData> => {
    const { data, error } = await $supabase
      .from('teams_members')
      .insert({ team_id: teamId, user_id: userId, role })
      .select()
      .single()
    if (error) throw new Error(`Failed to add team member: ${error.message}`)
    return data
  }

  /**
   * Remove a member from a team
   */
  const removeTeamMember = async (teamMemberId: number) => {
    const { error } = await $supabase
      .from('teams_members')
      .delete()
      .eq('id', teamMemberId)
    if (error) throw new Error(`Failed to remove team member: ${error.message}`)
  }

  /**
   * Get all teams for a garden
   */
  const fetchTeamsByGarden = async (gardenId: string): Promise<TeamData[]> => {
    const { data, error } = await $supabase
      .from('teams')
      .select('*, teams_members(*, profile:profiles(*))')
      .eq('garden_id', gardenId)
    if (error) throw new Error(`Failed to fetch teams: ${error.message}`)
    return data as TeamData[]
  }

  /**
   * Get all members for a team
   */
  const fetchTeamMembers = async (teamId: number): Promise<TeamMemberData[]> => {
    const { data, error } = await $supabase
      .from('teams_members')
      .select('*')
      .eq('team_id', teamId)
    if (error) throw new Error(`Failed to fetch team members: ${error.message}`)
    return data
  }

  /**
   * Get all teams for a user (where user is a member)
   */
  const fetchTeamsByUser = async (userId: string): Promise<TeamData[]> => {
    const { data, error } = await $supabase
      .from('teams_members')
      .select('team_id, teams(*)')
      .eq('user_id', userId)
    if (error) throw new Error(`Failed to fetch user teams: ${error.message}`)
    type TeamsMembersRow = {
      teams: TeamData | TeamData[]
    }
    return (data as TeamsMembersRow[])
      .map(row => row.teams)
      .flat()
      .filter((t): t is TeamData => !!t && typeof t === 'object' && 'id' in t)
  }

  return {
    createTeam,
    addTeamMember,
    removeTeamMember,
    removeTeam,
    fetchTeamsByGarden,
    fetchTeamMembers,
    fetchTeamsByUser,
  }
}

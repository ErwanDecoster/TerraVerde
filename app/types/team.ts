export interface TeamMemberProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  website?: string | null
  is_public?: boolean | null
}

export interface TeamMemberData {
  id: number
  created_at: string
  team_id: number
  user_id: string
  role?: string | null
  profile?: TeamMemberProfile
}

export interface TeamData {
  id: number
  created_at: string
  garden_id: string
  name?: string | null
  teams_members?: TeamMemberData[]
}

<script lang="ts" setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { z } from 'zod'
import { useTeam } from '~/composables/data/useTeam'
import { useAuth } from '~/composables/useAuth'
import { useProfile } from '~/composables/data/useProfile'
import type { TeamData, TeamRole } from '~/types/team'
import type { GardenData } from '~/types/garden'

interface Props {
  garden: GardenData
  currentRole?: 'owner' | 'admin' | 'editor' | 'viewer' | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'teamsUpdated'])
const open = ref(false)
const toast = useToast()
const {
  fetchTeamsByGarden,
  createTeam,
  addTeamMember,
  removeTeamMember,
  removeTeam,
} = useTeam()
const deletingTeam = ref<Record<number, boolean>>({})
const showDeleteTeamConfirm = ref<Record<number, boolean>>({})
const { user } = useAuth()

// Role-based permissions (owner/admin can manage teams & members)
const canManageTeams = computed(() =>
  ['owner', 'admin'].includes(props.currentRole || 'viewer'),
)
const canManageMembers = canManageTeams

const totalMembersCount = computed(() => {
  const ids = new Set<string>()
  for (const team of teams.value) {
    for (const member of team.teams_members || []) {
      ids.add(member.user_id)
    }
  }
  return ids.size
})

function teamHasOwner(team: TeamData) {
  return !!team.teams_members?.some(m => m.role === 'owner')
}

function canDeleteTeam(team: TeamData) {
  if (!canManageTeams.value) return false
  if (props.currentRole === 'admin' && teamHasOwner(team)) return false
  if (totalMembersCount.value === 1) return false
  return true
}

function canRemoveMember(team: TeamData, memberId: number) {
  if (!canManageMembers.value) return false
  const member = team.teams_members?.find(m => m.id === memberId)
  if (!member) return false
  if (props.currentRole === 'admin' && member.role === 'owner') return false
  if (totalMembersCount.value === 1) return false
  return true
}

async function onRemoveTeam(teamId: number) {
  const team = teams.value.find(t => t.id === teamId)
  if (!team || !canDeleteTeam(team)) return
  deletingTeam.value = { ...deletingTeam.value, [teamId]: true }
  try {
    await removeTeam(teamId)
    teams.value = teams.value.filter(t => t.id !== teamId)
    toast.add({
      title: 'Team Removed',
      description: 'Team deleted successfully',
      color: 'success',
    })
    emit('teamsUpdated')
  }
  catch (err) {
    const errorMsg
      = err instanceof Error ? err.message : 'Failed to remove team'
    toast.add({ title: 'Error', description: errorMsg, color: 'error' })
  }
  finally {
    deletingTeam.value = { ...deletingTeam.value, [teamId]: false }
    showDeleteTeamConfirm.value = {
      ...showDeleteTeamConfirm.value,
      [teamId]: false,
    }
  }
}

const teams = ref<TeamData[]>([])
const loading = ref(false)
const addingTeam = ref(false)
const addingMember = ref<Record<number, boolean>>({})
const newTeamName = ref('')
const newMemberUserId = reactive<Record<number, string>>({})
const newMemberRole = reactive<Record<number, TeamRole | undefined>>({})

const teamNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Max 100 characters'),
})

// Roles list shown in dropdown when adding a member.
// 'owner' only assignable by existing owner.
const ALL_ROLES: TeamRole[] = ['owner', 'admin', 'editor', 'viewer']
const roleOptions = computed(() => {
  return ALL_ROLES.filter(r =>
    r !== 'owner' ? true : props.currentRole === 'owner',
  ).map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))
})

const memberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer'], {
    message: 'Role is required',
  }),
})

async function loadTeams() {
  loading.value = true
  try {
    teams.value = await fetchTeamsByGarden(props.garden.id)
  }
  catch (err) {
    const errorMsg
      = err instanceof Error ? err.message : 'Failed to load teams'
    toast.add({ title: 'Error', description: errorMsg, color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function onAddTeam() {
  if (!canManageTeams.value) return
  addingTeam.value = true
  try {
    const parsed = teamNameSchema.parse({ name: newTeamName.value })
    const team = await createTeam(props.garden.id, parsed.name)
    teams.value.push(team)
    newTeamName.value = ''
    toast.add({
      title: 'Team Added',
      description: 'Team created successfully',
      color: 'success',
    })
    emit('teamsUpdated')
  }
  catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to add team'
    toast.add({ title: 'Error', description: errorMsg, color: 'error' })
  }
  finally {
    addingTeam.value = false
  }
}

async function onAddMember(teamId: number) {
  if (!canManageMembers.value) return
  addingMember.value[teamId] = true
  try {
    const parsed = memberSchema.parse({
      userId: newMemberUserId[teamId],
      role: newMemberRole[teamId] as TeamRole, // required now
    })
    const member = await addTeamMember(teamId, parsed.userId, parsed.role)
    // Fetch profile to enrich member for display of name instead of raw user_id
    try {
      const { fetchProfileById } = useProfile()
      const profile = await fetchProfileById(parsed.userId)
      if (profile) {
        member.profile = {
          id: profile.id,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || null,
          website: profile.website || null,
          is_public: profile.is_public || null,
        }
      }
    }
    catch (e) {
      console.warn('Could not fetch profile for new member', e)
    }
    // Attach new member to nested array; initialize if absent.
    const targetTeam = teams.value.find(t => t.id === teamId)
    if (targetTeam) {
      if (!targetTeam.teams_members) targetTeam.teams_members = []
      targetTeam.teams_members.push(member)
    }
    newMemberUserId[teamId] = ''
    newMemberRole[teamId] = undefined
    toast.add({
      title: 'Member Added',
      description: 'Member added to team',
      color: 'success',
    })
    emit('teamsUpdated')
  }
  catch (err) {
    const errorMsg
      = err instanceof Error ? err.message : 'Failed to add member'
    toast.add({ title: 'Error', description: errorMsg, color: 'error' })
  }
  finally {
    addingMember.value[teamId] = false
  }
}

async function onRemoveMember(teamId: number, memberId: number) {
  const team = teams.value.find(t => t.id === teamId)
  if (!team || !canRemoveMember(team, memberId)) return
  try {
    await removeTeamMember(memberId)
    const targetTeam = teams.value.find(t => t.id === teamId)
    if (targetTeam?.teams_members) {
      const removedMember = targetTeam.teams_members.find(
        m => m.id === memberId,
      )
      targetTeam.teams_members = targetTeam.teams_members.filter(
        m => m.id !== memberId,
      )

      if (
        removedMember
        && user.value
        && removedMember.user_id === user.value.id
      ) {
        toast.add({
          title: 'You left the garden',
          description: 'Redirecting to your gardens list.',
          color: 'info',
        })
        open.value = false
        return
      }

      if (props.garden.is_public) {
        try {
          await refreshNuxtData()
        }
        catch (e) {
          console.warn('Failed to refresh page data after member removal', e)
        }
      }
      else {
        await navigateTo('/gardens')
      }
    }
    toast.add({
      title: 'Member Removed',
      description: 'Member removed from team',
      color: 'success',
    })
    emit('teamsUpdated')
  }
  catch (err) {
    const errorMsg
      = err instanceof Error ? err.message : 'Failed to remove member'
    toast.add({ title: 'Error', description: errorMsg, color: 'error' })
  }
}

onMounted(loadTeams)
watch(() => props.garden.id, loadTeams)
</script>

<template>
  <UModal
    v-model:open="open"
    title="Manage Teams"
    description="View and manage teams for this garden."
  >
    <UButton
      label="Manage Teams"
      :disabled="!canManageTeams"
      variant="outline"
      icon="i-heroicons-users-20-solid"
      class="justify-center"
    />
    <template #body>
      <div
        v-if="loading"
        class="text-center py-4"
      >
        Loading teams...
      </div>
      <div v-else>
        <div class="mb-6">
          <div v-if="canManageTeams">
            <UForm @submit.prevent="onAddTeam">
              <UFormField
                label="New Team Name"
                name="name"
              >
                <UInput
                  v-model="newTeamName"
                  placeholder="Enter team name"
                  class="w-full"
                />
              </UFormField>
              <UButton
                :loading="addingTeam"
                type="submit"
                icon="i-heroicons-plus-20-solid"
                class="mt-2"
              >
                Add Team
              </UButton>
            </UForm>
          </div>
          <p
            v-else
            class="text-xs text-muted mb-4"
          >
            You don't have permission to create teams.
          </p>
        </div>
        <div
          v-for="team in teams"
          :key="team.id"
          class="mb-8 border border-muted rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold">
              {{ team.name || "Unnamed Team" }}
            </div>
            <div v-if="canDeleteTeam(team) && !showDeleteTeamConfirm[team.id]">
              <UButton
                size="xs"
                color="error"
                variant="outline"
                icon="i-heroicons-trash-20-solid"
                :loading="deletingTeam[team.id]"
                :disabled="!canDeleteTeam(team)"
                @click="showDeleteTeamConfirm[team.id] = true"
              >
                Delete Team
              </UButton>
            </div>
            <div
              v-else-if="showDeleteTeamConfirm[team.id]"
              class="mb-2 flex gap-2 items-center"
            >
              <UButton
                size="xs"
                color="error"
                :loading="deletingTeam[team.id]"
                :disabled="!canDeleteTeam(team)"
                @click="onRemoveTeam(team.id)"
              >
                Confirm Delete
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                @click="showDeleteTeamConfirm[team.id] = false"
              >
                Cancel
              </UButton>
            </div>
          </div>
          <div class="mb-2">
            Members:
          </div>
          <ul
            v-if="team.teams_members?.length"
            class="mb-2"
          >
            <li
              v-for="member in team.teams_members"
              :key="member.id"
              class="flex items-center gap-2"
            >
              <span>
                <!-- Prefer profile name if available -->
                <template v-if="member.profile">
                  {{
                    (member.profile.first_name || "")
                      + " "
                      + (member.profile.last_name || "")
                  }}
                </template>
                <template v-else>
                  {{ member.user_id }}
                </template>
              </span>
              <span
                v-if="member.role"
                class="text-xs text-gray-500"
              >({{ member.role }})</span>
              <UButton
                v-if="canRemoveMember(team, member.id)"
                size="xs"
                color="error"
                variant="outline"
                icon="i-heroicons-trash-20-solid"
                @click="onRemoveMember(team.id, member.id)"
              >
                Remove
              </UButton>
            </li>
          </ul>
          <p
            v-else
            class="text-xs text-gray-500 mb-2"
          >
            No members yet
          </p>
          <UForm
            v-if="canManageMembers"
            class="flex gap-2 items-end"
            @submit.prevent="onAddMember(team.id)"
          >
            <UFormField
              label="User ID"
              name="userId"
            >
              <UInput
                v-model="newMemberUserId[team.id]"
                placeholder="User ID"
              />
            </UFormField>
            <UFormField
              label="Role"
              name="role"
              required
            >
              <USelect
                v-model="newMemberRole[team.id]"
                :items="roleOptions"
                placeholder="Select role"
                class="min-w-40"
              />
            </UFormField>
            <UButton
              :loading="addingMember[team.id]"
              :disabled="!newMemberUserId[team.id] || !newMemberRole[team.id]"
              type="submit"
              icon="i-heroicons-plus-20-solid"
            >
              Add Member
            </UButton>
          </UForm>
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <div class="flex justify-end w-full">
        <UButton
          variant="ghost"
          @click="close"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>

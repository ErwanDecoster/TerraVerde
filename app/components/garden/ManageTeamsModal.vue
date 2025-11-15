<script lang="ts" setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { z } from 'zod'
import { useTeam } from '~/composables/data/useTeam'
import type { TeamData, TeamMemberData } from '~/types/team'
import type { GardenData } from '~/types/garden'

interface Props {
  garden: GardenData
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

async function onRemoveTeam(teamId: number) {
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
const newMemberRole = reactive<Record<number, string>>({})

const teamNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Max 100 characters'),
})

const memberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.string().max(50, 'Max 50 characters').optional(),
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
  addingMember.value[teamId] = true
  try {
    const parsed = memberSchema.parse({
      userId: newMemberUserId[teamId],
      role: newMemberRole[teamId],
    })
    const member = await addTeamMember(teamId, parsed.userId, parsed.role)
    // Attach new member to nested array; initialize if absent.
    const targetTeam = teams.value.find(t => t.id === teamId)
    if (targetTeam) {
      if (!targetTeam.teams_members) targetTeam.teams_members = []
      targetTeam.teams_members.push(member)
    }
    newMemberUserId[teamId] = ''
    newMemberRole[teamId] = ''
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
  try {
    await removeTeamMember(memberId)
    const targetTeam = teams.value.find(t => t.id === teamId)
    if (targetTeam?.teams_members) {
      targetTeam.teams_members = targetTeam.teams_members.filter(
        m => m.id !== memberId,
      )
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
        <div
          v-for="team in teams"
          :key="team.id"
          class="mb-8 border border-muted rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold">
              {{ team.name || "Unnamed Team" }}
            </div>
            <div v-if="!showDeleteTeamConfirm[team.id]">
              <UButton
                size="xs"
                color="error"
                variant="outline"
                icon="i-heroicons-trash-20-solid"
                :loading="deletingTeam[team.id]"
                @click="showDeleteTeamConfirm[team.id] = true"
              >
                Delete Team
              </UButton>
            </div>
            <div
              v-else
              class="mb-2 flex gap-2 items-center"
            >
              <UButton
                size="xs"
                color="error"
                :loading="deletingTeam[team.id]"
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
            >
              <UInput
                v-model="newMemberRole[team.id]"
                placeholder="Role (optional)"
              />
            </UFormField>
            <UButton
              :loading="addingMember[team.id]"
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

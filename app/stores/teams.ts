import { useTeam } from "~/composables/data/useTeam";
import type { GardenData } from "~/types/garden";
import type { TeamData, TeamRole } from "~/types/team";

interface GardenAccessState {
  allowed: boolean;
  role: TeamRole | null;
  isTeamMember: boolean;
}

export const useTeamsStore = defineStore("teams", () => {
  const authStore = useAuthStore();
  const {
    createTeam,
    addTeamMember,
    removeTeamMember,
    removeTeam,
    fetchTeamsByGarden,
    fetchTeamMembers,
    fetchTeamsByUser,
  } = useTeam();

  const teamsByGarden = ref<Record<string, TeamData[]>>({});
  const accessByGarden = ref<Record<string, GardenAccessState>>({});
  const loadingByGarden = ref<Record<string, boolean>>({});

  const setGardenLoading = (gardenId: string, loading: boolean) => {
    loadingByGarden.value = {
      ...loadingByGarden.value,
      [gardenId]: loading,
    };
  };

  const fetchGardenTeams = async (
    gardenId: string,
    options?: { force?: boolean },
  ) => {
    if (!options?.force && teamsByGarden.value[gardenId]) {
      return teamsByGarden.value[gardenId];
    }

    setGardenLoading(gardenId, true);

    try {
      const teams = await fetchTeamsByGarden(gardenId);
      teamsByGarden.value = {
        ...teamsByGarden.value,
        [gardenId]: teams,
      };
      return teams;
    } finally {
      setGardenLoading(gardenId, false);
    }
  };

  const resolveGardenAccess = async (
    gardenId: string,
    gardenData: GardenData,
    options?: { force?: boolean },
  ) => {
    const defaultAccess: GardenAccessState = {
      allowed: Boolean(gardenData.is_public),
      role: gardenData.is_public ? "viewer" : null,
      isTeamMember: false,
    };

    if (!authStore.user) {
      await authStore.initialize();
    }

    if (!authStore.user) {
      accessByGarden.value = {
        ...accessByGarden.value,
        [gardenId]: defaultAccess,
      };
      return defaultAccess;
    }

    const teams = await fetchGardenTeams(gardenId, options);
    const members = teams.flatMap((team) => team.teams_members || []);
    const currentMember = members.find(
      (member) => member.user_id === authStore.user?.id,
    );

    const nextAccess: GardenAccessState = currentMember
      ? {
          allowed: true,
          role: currentMember.role || "viewer",
          isTeamMember: true,
        }
      : defaultAccess;

    accessByGarden.value = {
      ...accessByGarden.value,
      [gardenId]: nextAccess,
    };

    return nextAccess;
  };

  const getGardenAccess = (gardenId: string) => {
    return accessByGarden.value[gardenId] || null;
  };

  const isGardenOwner = async (gardenId: string) => {
    const teams = await fetchGardenTeams(gardenId);
    const members = teams.flatMap((team) => team.teams_members || []);

    return members.some(
      (member) =>
        member.user_id === authStore.user?.id && member.role === "owner",
    );
  };

  const resetGardenState = (gardenId: string) => {
    const { [gardenId]: _teams, ...nextTeams } = teamsByGarden.value;
    const { [gardenId]: _access, ...nextAccess } = accessByGarden.value;
    const { [gardenId]: _loading, ...nextLoading } = loadingByGarden.value;

    teamsByGarden.value = nextTeams;
    accessByGarden.value = nextAccess;
    loadingByGarden.value = nextLoading;
  };

  return {
    teamsByGarden,
    accessByGarden,
    loadingByGarden,
    createTeam,
    addTeamMember,
    removeTeamMember,
    removeTeam,
    fetchTeamMembers,
    fetchTeamsByUser,
    fetchGardenTeams,
    resolveGardenAccess,
    getGardenAccess,
    isGardenOwner,
    resetGardenState,
  };
});

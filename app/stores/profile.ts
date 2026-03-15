import { useProfile } from "~/composables/data/useProfile";
import type { ProfileData, ProfileUpdateFormData } from "~/types/profile";

export const useProfileStore = defineStore("profile", () => {
  const authStore = useAuthStore();
  const {
    fetchMyProfile,
    fetchPublicProfiles,
    fetchProfileById,
    updateProfile,
  } = useProfile();

  const currentProfile = ref<ProfileData | null>(null);
  const publicProfiles = ref<ProfileData[]>([]);
  const profilesById = ref<Record<string, ProfileData>>({});
  const loadingCurrent = ref(false);
  const loadingPublic = ref(false);
  const savingCurrent = ref(false);
  const loadedUserId = ref<string | null>(null);

  const resetCurrentProfile = () => {
    currentProfile.value = null;
    loadedUserId.value = null;
    loadingCurrent.value = false;
    savingCurrent.value = false;
  };

  const resetAll = () => {
    resetCurrentProfile();
    publicProfiles.value = [];
    profilesById.value = {};
    loadingPublic.value = false;
  };

  const fetchCurrentProfile = async (options?: { force?: boolean }) => {
    const userId = authStore.user?.id ?? null;

    if (!userId) {
      resetCurrentProfile();
      return null;
    }

    if (
      !options?.force &&
      loadedUserId.value === userId &&
      currentProfile.value
    ) {
      return currentProfile.value;
    }

    loadingCurrent.value = true;

    try {
      const profile = await fetchMyProfile();
      currentProfile.value = profile;
      loadedUserId.value = userId;

      if (profile) {
        profilesById.value = {
          ...profilesById.value,
          [profile.id]: profile,
        };
      }

      return profile;
    } finally {
      loadingCurrent.value = false;
    }
  };

  const updateCurrentProfile = async (
    formData: ProfileUpdateFormData,
    currentAvatarPath?: string,
  ) => {
    savingCurrent.value = true;

    try {
      const updatedProfile = await updateProfile(formData, currentAvatarPath);
      currentProfile.value = updatedProfile;

      if (authStore.user?.id) {
        loadedUserId.value = authStore.user.id;
      }

      profilesById.value = {
        ...profilesById.value,
        [updatedProfile.id]: updatedProfile,
      };

      publicProfiles.value = updatedProfile.is_public
        ? upsertProfile(publicProfiles.value, updatedProfile)
        : publicProfiles.value.filter(
            (profile) => profile.id !== updatedProfile.id,
          );

      return updatedProfile;
    } finally {
      savingCurrent.value = false;
    }
  };

  const fetchAllPublicProfiles = async (options?: { force?: boolean }) => {
    if (!options?.force && publicProfiles.value.length > 0) {
      return publicProfiles.value;
    }

    loadingPublic.value = true;

    try {
      const profiles = await fetchPublicProfiles();
      publicProfiles.value = profiles;
      profilesById.value = profiles.reduce<Record<string, ProfileData>>(
        (accumulator, profile) => {
          accumulator[profile.id] = profile;
          return accumulator;
        },
        { ...profilesById.value },
      );

      return profiles;
    } finally {
      loadingPublic.value = false;
    }
  };

  const fetchProfile = async (
    profileId: string,
    options?: { force?: boolean },
  ) => {
    if (!options?.force && profilesById.value[profileId]) {
      return profilesById.value[profileId];
    }

    const profile = await fetchProfileById(profileId);

    if (profile) {
      profilesById.value = {
        ...profilesById.value,
        [profile.id]: profile,
      };
    }

    return profile;
  };

  return {
    currentProfile,
    publicProfiles,
    profilesById,
    loadingCurrent,
    loadingPublic,
    savingCurrent,
    loadedUserId,
    fetchCurrentProfile,
    updateCurrentProfile,
    fetchAllPublicProfiles,
    fetchProfile,
    resetCurrentProfile,
    resetAll,
  };
});

const upsertProfile = (profiles: ProfileData[], profile: ProfileData) => {
  const existingIndex = profiles.findIndex(
    (current) => current.id === profile.id,
  );

  if (existingIndex === -1) {
    return [profile, ...profiles];
  }

  const nextProfiles = [...profiles];
  nextProfiles[existingIndex] = profile;
  return nextProfiles;
};

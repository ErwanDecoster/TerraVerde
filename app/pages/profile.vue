<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { ProfileData } from '~/types/profile'
import { useProfile } from '~/composables/data/useProfile'

const { fetchMyProfile, updateProfile } = useProfile()
const { user } = useAuth()
const toast = useToast()

const loadingProfile = ref(true)
const profile = ref<ProfileData | null>(null)

const initials = computed(() => {
  const fn = profile.value?.first_name?.charAt(0) || ''
  const ln = profile.value?.last_name?.charAt(0) || ''
  return fn + ln || 'U'
})

onMounted(async () => {
  if (!user.value) return
  try {
    profile.value = await fetchMyProfile()
  }
  catch (err) {
    console.warn('No profile found for user', err)
  }
  finally {
    loadingProfile.value = false
  }
})

const fileSchema
  = typeof File !== 'undefined'
    ? z.instanceof(File, { message: 'Avatar file must be an image' })
    : z.any().optional()

const schema = z.object({
  first_name: z
    .string()
    .max(100, 'First name cannot exceed 100 characters')
    .optional()
    .nullable(),
  last_name: z
    .string()
    .max(100, 'Last name cannot exceed 100 characters')
    .optional()
    .nullable(),
  avatar_file: fileSchema
    .optional()
    .refine(
      file =>
        !file || !('size' in file) || (file as File).size <= 2 * 1024 * 1024,
      'Avatar file size must not exceed 2MB',
    )
    .refine(
      file =>
        !file
        || !('type' in file)
        || ['image/jpeg', 'image/png', 'image/webp'].includes((file as File).type),
      'Unsupported image format (JPEG, PNG, WebP only)',
    ),
  bio: z
    .string()
    .max(2000, 'Bio cannot exceed 2000 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Please enter a valid URL')
    .max(200, 'Website URL cannot exceed 200 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_public: z.boolean().optional(),
})
export type ProfileEditSchema = z.output<typeof schema>

const state = reactive<Partial<ProfileEditSchema>>({
  first_name: '',
  last_name: '',
  avatar_file: undefined,
  bio: '',
  website: '',
  is_public: false,
})

watch(
  profile,
  (p) => {
    if (!p) return
    Object.assign(state, {
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      avatar_file: undefined,
      bio: p.bio ?? '',
      website: p.website ?? '',
      is_public: p.is_public ?? false,
    })
  },
  { immediate: true },
)

const form = ref()
const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<ProfileEditSchema>) {
  if (!profile.value) return
  saving.value = true
  try {
    const d = event.data
    const updated = await updateProfile(
      {
        first_name: d.first_name ?? null,
        last_name: d.last_name ?? null,
        avatar_file: d.avatar_file,
        bio: d.bio ?? null,
        website: d.website || null,
        is_public: d.is_public ?? false,
      },
      profile.value.avatar_url?.split('/').pop() || undefined,
    )
    profile.value = updated
    state.avatar_file = undefined
    toast.add({ title: 'Profile Updated', color: 'success' })
  }
  catch (e) {
    console.error(e)
    toast.add({
      title: 'Error',
      description: 'Failed to update profile',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold mb-6">
      My Profile
    </h1>
    <div
      v-if="loadingProfile"
      class="py-12 flex justify-center"
    >
      <div
        class="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600"
      />
    </div>
    <div
      v-else-if="!profile"
      class="text-gray-600 dark:text-gray-300"
    >
      <p>
        No profile exists yet. It will be created automatically at registration.
      </p>
    </div>
    <div
      v-else
      class="space-y-6"
    >
      <div class="flex items-center gap-4">
        <div
          v-if="profile.avatar_url"
          class="w-20 h-20 rounded-full overflow-hidden"
        >
          <img
            :src="profile.avatar_url"
            :alt="profile.first_name || 'Avatar'"
            class="w-full h-full object-cover"
          >
        </div>
        <div
          v-else
          class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-xl"
        >
          {{ initials }}
        </div>
        <div class="flex-1">
          <h2 class="text-lg font-medium">
            {{ profile.first_name }} {{ profile.last_name }}
          </h2>
          <p
            v-if="profile.website"
            class="text-sm text-blue-600 dark:text-blue-400"
          >
            <a
              :href="profile.website"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:underline"
            >{{ profile.website }}</a>
          </p>
        </div>
      </div>

      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="grid grid-cols-2 gap-4"
        @submit="onSubmit"
      >
        <UFormField
          label="First Name"
          name="first_name"
          class="col-span-1"
        >
          <UInput
            v-model="state.first_name"
            placeholder="First name"
            :maxlength="100"
          />
        </UFormField>
        <UFormField
          label="Last Name"
          name="last_name"
          class="col-span-1"
        >
          <UInput
            v-model="state.last_name"
            placeholder="Last name"
            :maxlength="100"
          />
        </UFormField>
        <UFormField
          name="avatar_file"
          label="New Avatar (Optional)"
          class="col-span-2"
          description="JPEG, PNG, WebP. Max 4MB."
        >
          <UFileUpload
            v-model="state.avatar_file"
            accept="image/jpeg,image/png,image/webp"
            class="min-h-32"
          />
        </UFormField>
        <UFormField
          label="Bio"
          name="bio"
          class="col-span-2"
        >
          <TiptapEditor
            v-model="state.bio"
            :max-length="2000"
            placeholder="Tell us about yourself (optional)"
          />
        </UFormField>
        <UFormField
          label="Website"
          name="website"
          class="col-span-2"
        >
          <UInput
            v-model="state.website"
            placeholder="https://example.com"
            :maxlength="200"
          />
        </UFormField>
        <UFormField
          label="Public Profile"
          name="is_public"
          class="col-span-2"
        >
          <USwitch
            v-model="state.is_public"
            label="Make your profile visible to other users"
          />
        </UFormField>
      </UForm>

      <div class="flex justify-end col-span-2 mt-2">
        <UButton
          color="primary"
          icon="i-heroicons-check-20-solid"
          :loading="saving"
          :disabled="saving"
          @click="form.submit()"
        >
          Save Changes
        </UButton>
      </div>
    </div>
  </div>
</template>

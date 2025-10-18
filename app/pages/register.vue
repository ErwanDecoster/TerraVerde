<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { supabaseClient } from '~/composables/supabase'

definePageMeta({
  middleware: ['guest'],
})
const toast = useToast()

const fields: AuthFormField[] = [
  {
    name: 'first_name',
    type: 'text',
    label: 'First Name',
    placeholder: 'Enter your first name',
    autocomplete: 'given-name',
    required: true,
  },
  {
    name: 'last_name',
    type: 'text',
    label: 'Last Name',
    placeholder: 'Enter your last name',
    autocomplete: 'family-name',
    required: true,
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    autocomplete: 'email',
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    autocomplete: 'new-password',
    hint: 'Lowercase, uppercase letters, digits and symbols and at least 12 characters',
    errorPattern:
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/,
    required: true,
  },
]

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
      toast.add({ title: 'Google', description: 'Login with Google' })
    },
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => {
      toast.add({ title: 'GitHub', description: 'Login with GitHub' })
    },
  },
]

const schema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  email: z.email('Invalid email'),
  password: z
    .string('Password is required')
    .min(12, 'Password must be at least 12 characters')
    .regex(
      /^(?=.*?[A-Z])/,
      'Password must contain at least one uppercase letter',
    ),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { error } = await supabaseClient.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    options: {
      data: {
        first_name: payload.data.first_name,
        last_name: payload.data.last_name,
      },
    },
  })
  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'error',
    })
  }
  else {
    toast.add({
      title: 'Success',
      description: 'Check your email for confirmation link',
      color: 'success',
      duration: 10000,
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 px-4 py-8">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        title="Welcome back!"
        icon="i-lucide-lock"
        @submit="onSubmit"
      >
        <template #description>
          Already have an account?
          <ULink
            to="/login"
            class="text-primary font-medium"
          >Sign in</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

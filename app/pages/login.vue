<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  middleware: ['guest'],
})
const toast = useToast()

const fields: AuthFormField[] = [
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
    autocomplete: 'current-password',
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
  const { login } = useAuth()

  const { error } = await login(payload.data.email, payload.data.password)

  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'error',
    })
  }
  else {
    await navigateTo('/')
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
          Don't have an account?
          <ULink
            to="/register"
            class="text-primary font-medium"
          >Sign up</ULink>.
        </template>
        <template #password-hint>
          <ULink
            to="/password-reset"
            class="text-primary font-medium"
            tabindex="-1"
          >Forgot password?</ULink>
        </template>
        <template #validation>
          <!-- <UAlert color="error" icon="i-lucide-info" title="Error signing in" /> -->
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

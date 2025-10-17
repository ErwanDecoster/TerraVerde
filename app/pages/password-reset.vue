<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const toast = useToast();
const route = useRoute();
const { user } = useAuth();
const step = computed(() => {
  return route.query.step === "2" ? 2 : 1;
});

const emailFields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    autocomplete: "email",
    required: true,
  },
];

const passwordFields: AuthFormField[] = [
  {
    name: "password",
    type: "password",
    label: "New Password",
    placeholder: "Enter your new password",
    autocomplete: "new-password",
    hint: "Lowercase, uppercase letters, digits and symbols and at least 12 characters",
    errorPattern:
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/,
    required: true,
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm Password",
    placeholder: "Confirm your new password",
    autocomplete: "new-password",
    required: true,
  },
];

const emailSchema = z.object({
  email: z.email("Invalid email"),
});

const passwordSchema = z
  .object({
    password: z
      .string("Password is required")
      .min(12, "Password must be at least 12 characters")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one digit and one special character"
      ),
    confirmPassword: z.string("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailSchema = z.output<typeof emailSchema>;
type PasswordSchema = z.output<typeof passwordSchema>;

async function onSubmitEmail(payload: FormSubmitEvent<EmailSchema>) {
  const { resetPassword } = useAuth();

  const { error } = await resetPassword(payload.data.email);

  if (error) {
    toast.add({
      title: "Error",
      description: error.message,
      color: "error",
    });
  } else {
    toast.add({
      title: "Success",
      description: "Check your email for a password reset link",
      color: "success",
    });
  }
}

async function onSubmitPassword(payload: FormSubmitEvent<PasswordSchema>) {
  const { updatePassword } = useAuth();

  const { error } = await updatePassword(payload.data.password);

  if (error) {
    console.error(error);

    toast.add({
      title: "Error",
      description: error.message,
      color: "error",
    });
  } else {
    toast.add({
      title: "Success",
      description: "Password updated successfully",
      color: "success",
    });
    await navigateTo("/dashboard");
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 px-4 py-8">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        v-if="step === 1"
        :schema="emailSchema"
        :fields="emailFields"
        title="Password Recovery"
        icon="i-lucide-lock"
        @submit="onSubmitEmail"
        :submit="{ label: 'Send reset email' }"
      >
        <template v-if="!user" #description>
          Remember your password?
          <ULink to="/login" class="text-primary font-medium">Sign in</ULink>.
        </template>
      </UAuthForm>

      <UAuthForm
        v-else
        :schema="passwordSchema"
        :fields="passwordFields"
        title="Set New Password"
        icon="i-lucide-key"
        @submit="onSubmitPassword"
        :submit="{ label: 'Update password' }"
      >
        <template #description> Enter your new password below. </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

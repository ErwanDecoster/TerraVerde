import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL || '',
      supabaseProjectId: process.env.NUXT_SUPABASE_PROJECT_ID || '',
      supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY || '',
    },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})

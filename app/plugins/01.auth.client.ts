import type { User } from '@supabase/supabase-js'

export default defineNuxtPlugin(async () => {
  const user = useState<User | null>('auth.user', () => null)
  const { $supabase } = useNuxtApp()

  const { data } = await $supabase.auth.getUser()
  user.value = data.user

  $supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
  })
})

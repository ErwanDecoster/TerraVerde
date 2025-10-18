import type { User } from '@supabase/supabase-js'
import { supabaseClient } from '~/composables/supabase'

export default defineNuxtPlugin(async () => {
  const user = useState<User | null>('auth.user', () => null)
  const { getUser } = useAuth()

  await getUser()

  supabaseClient.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })
})

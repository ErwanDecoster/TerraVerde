import { supabaseClient } from "~/composables/supabase";

export default defineNuxtPlugin(async () => {
  const user = useState<any>('auth.user', () => null);
  const { getUser } = useAuth();
  
  await getUser();
  
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    user.value = session?.user || null;
  });
});
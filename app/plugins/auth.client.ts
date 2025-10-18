import { supabaseClient } from "~/composables/supabase";

export default defineNuxtPlugin(async () => {
  const user = useState<any>('auth.user', () => null);
  const { getUser } = useAuth();
  
  await getUser();
  
  supabaseClient.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null;
  });
});
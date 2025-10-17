import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL as string || "https://tvqeubgblmwvracewenz.supabase.co";
const supabaseKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY as string || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cWV1YmdibG13dnJhY2V3ZW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzg0OTUsImV4cCI6MjA3NDY1NDQ5NX0.nIeSTa6BP2CHogFLrVjlyYWOfVP_voVFqxC12BeGazQ";
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey);

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
import { getEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

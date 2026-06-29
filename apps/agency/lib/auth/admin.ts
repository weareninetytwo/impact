import { createClient } from "@supabase/supabase-js";
import { readEnv, readSupabaseUrl } from "@/lib/supabase/env";

/** Service-role client for auth admin (signup metadata, invites). Server only. */
export function createSupabaseAdminClient() {
  const url = readSupabaseUrl();
  const serviceKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? readEnv("SUPABASE_SECRET_KEY");
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

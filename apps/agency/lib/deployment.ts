import {
  getPersistenceMode,
  isSupabaseConfigured,
} from "@impact/db";

export function getDeploymentInfo() {
  return {
    persistenceMode: getPersistenceMode(),
    supabaseConfigured: isSupabaseConfigured(),
    basicAuthEnabled: Boolean(process.env.IMPACT_BASIC_AUTH_PASSWORD),
    vercel: Boolean(process.env.VERCEL),
  };
}

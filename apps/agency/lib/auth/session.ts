import { getAuthPlaceholder } from "./placeholder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/supabase/env";
import {
  getAppUser,
  getTenantById,
  resolveDefaultTenantId,
  upsertAppUser,
  type AppUserRecord,
} from "@impact/db";

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  role: "owner" | "admin" | "bd_rep" | "viewer";
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (!isSupabaseAuthEnabled()) {
    return getAuthPlaceholder();
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const tenantId =
    (user.app_metadata?.tenant_id as string | undefined) ??
    (user.user_metadata?.tenant_id as string | undefined);

  const appUser = await getAppUser(user.id).catch(() => null);
  let resolvedTenantId = appUser?.tenant_id ?? tenantId;

  if (!resolvedTenantId) {
    resolvedTenantId = await resolveDefaultTenantId().catch(() => undefined);
  }

  if (!resolvedTenantId) return null;

  if (!appUser && resolvedTenantId) {
    await upsertAppUser({
      id: user.id,
      tenant_id: resolvedTenantId,
      email: user.email ?? "",
      full_name:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User",
      role: (user.app_metadata?.role as AppUserRecord["role"]) ?? "bd_rep",
    }).catch(() => undefined);
  }

  const tenant = await getTenantById(resolvedTenantId).catch(() => null);

  return {
    userId: user.id,
    email: user.email ?? appUser?.email ?? "",
    fullName:
      appUser?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "User",
    tenantId: resolvedTenantId,
    tenantName: tenant?.name ?? "Organization",
    role: appUser?.role ?? "bd_rep",
  };
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

export function isAuthGuardEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

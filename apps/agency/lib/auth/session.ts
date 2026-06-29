import { getAuthPlaceholder } from "./placeholder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/supabase/env";
import {
  getAppUser,
  getTenantById,
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
  const resolvedTenantId = appUser?.tenant_id ?? tenantId;

  if (!resolvedTenantId) return null;

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

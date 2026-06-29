"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createTenantRecord,
  getTenantBySlug,
  resolveDefaultTenantId,
  slugify,
  upsertAppUser,
  type AppUserRecord,
} from "@impact/db";
import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthEnabled } from "@/lib/supabase/env";

export async function signInAction(formData: FormData) {
  if (!isSupabaseAuthEnabled()) {
    return { error: "Auth is not configured" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard").trim() || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Auth client unavailable" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const tenantId =
      (user.app_metadata?.tenant_id as string | undefined) ??
      (await resolveDefaultTenantId());
    await upsertAppUser({
      id: user.id,
      tenant_id: tenantId,
      email: user.email ?? email,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        email.split("@")[0],
      role: (user.app_metadata?.role as AppUserRecord["role"]) ?? "bd_rep",
    }).catch(() => undefined);
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseAuthEnabled()) {
    return { error: "Auth is not configured" };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "join");
  const orgName = String(formData.get("org_name") ?? "").trim();
  const tenantSlug = String(formData.get("tenant_slug") ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return { error: "Auth client unavailable" };

  let tenantId: string;
  let role: "owner" | "bd_rep" = "bd_rep";

  if (mode === "create" && orgName) {
    const slug = slugify(orgName);
    const existing = await getTenantBySlug(slug);
    if (existing) {
      return { error: "Organization slug already exists — try joining instead" };
    }
    const tenant = await createTenantRecord(orgName, slug);
    tenantId = tenant.id;
    role = "owner";
  } else {
    const slug =
      tenantSlug ||
      process.env.IMPACT_DEFAULT_TENANT_SLUG?.trim() ||
      "ninety-two";
    const tenant = await getTenantBySlug(slug);
    tenantId = tenant?.id ?? (await resolveDefaultTenantId());
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, tenant_id: tenantId },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Signup failed" };

  await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { tenant_id: tenantId, role },
    user_metadata: { full_name: fullName },
  });

  await upsertAppUser({
    id: data.user.id,
    tenant_id: tenantId,
    email,
    full_name: fullName,
    role,
  });

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    ok: true,
    message: "Check your email to confirm your account, then sign in.",
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

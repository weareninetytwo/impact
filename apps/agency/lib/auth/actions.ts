"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirectAuth } from "@/lib/auth/redirect";
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

export async function syncAppUserAfterLogin() {
  if (!isSupabaseAuthEnabled()) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const tenantId =
    (user.app_metadata?.tenant_id as string | undefined) ??
    (await resolveDefaultTenantId());

  await upsertAppUser({
    id: user.id,
    tenant_id: tenantId,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User",
    role: (user.app_metadata?.role as AppUserRecord["role"]) ?? "bd_rep",
  }).catch(() => undefined);
}

export async function signInAction(formData: FormData) {
  const next = String(formData.get("next") ?? "/dashboard").trim() || "/dashboard";

  try {
    if (!isSupabaseAuthEnabled()) {
      redirectAuth("/login", { error: "Auth is not configured", next });
    }

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirectAuth("/login", { error: "Email and password are required", next });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      redirectAuth("/login", { error: "Auth client unavailable", next });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirectAuth("/login", { error: error.message, next });
    }

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
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : "Sign in failed";
    redirectAuth("/login", { error: message, next });
  }
}

export async function signUpAction(formData: FormData) {
  try {
    if (!isSupabaseAuthEnabled()) {
      redirectAuth("/signup", { error: "Auth is not configured" });
    }

    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const mode = String(formData.get("mode") ?? "join");
    const orgName = String(formData.get("org_name") ?? "").trim();
    const tenantSlug = String(formData.get("tenant_slug") ?? "").trim();

    if (!fullName || !email || !password) {
      redirectAuth("/signup", {
        error: "Name, email, and password are required",
      });
    }
    if (password.length < 8) {
      redirectAuth("/signup", {
        error: "Password must be at least 8 characters",
      });
    }

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) {
      redirectAuth("/signup", { error: "Auth client unavailable" });
    }

    let tenantId: string;
    let role: "owner" | "bd_rep" = "bd_rep";

    if (mode === "create" && orgName) {
      const slug = slugify(orgName);
      const existing = await getTenantBySlug(slug);
      if (existing) {
        redirectAuth("/signup", {
          error: "Organization slug already exists — try joining instead",
        });
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://impact.weareninetytwo.xyz"}/auth/callback`,
      },
    });

    if (error) redirectAuth("/signup", { error: error.message });
    if (!data.user) redirectAuth("/signup", { error: "Signup failed" });

    const user = data.user;

    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { tenant_id: tenantId, role },
      user_metadata: { full_name: fullName },
      email_confirm: true,
    });

    await upsertAppUser({
      id: user.id,
      tenant_id: tenantId,
      email,
      full_name: fullName,
      role,
    });

    if (data.session) {
      redirect("/dashboard");
    }

    redirectAuth("/login", {
      message:
        "Account created. Check your email to confirm, then sign in. If you don't see it, check spam or ask an admin to confirm your user in Supabase.",
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : "Signup failed";
    redirectAuth("/signup", { error: message });
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

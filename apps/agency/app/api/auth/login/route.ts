import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  resolveDefaultTenantId,
  upsertAppUser,
  type AppUserRecord,
} from "@impact/db";
import { readSupabaseAnonKey, readSupabaseUrl } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard").trim() || "/dashboard";
  const origin = new URL(request.url).origin;

  if (!email || !password) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Email and password are required")}&next=${encodeURIComponent(next)}`,
    );
  }

  const url = readSupabaseUrl();
  const anonKey = readSupabaseAnonKey();
  if (!url || !anonKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Auth is not configured")}`,
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`,
    );
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

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}

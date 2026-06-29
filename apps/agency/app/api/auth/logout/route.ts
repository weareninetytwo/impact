import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseAnonKey, readSupabaseUrl } from "@/lib/supabase/env";

/** Clear Supabase session cookies and return to login. */
export async function GET(request: NextRequest) {
  const url = readSupabaseUrl();
  const anonKey = readSupabaseAnonKey();
  const origin = new URL(request.url).origin;

  if (url && anonKey) {
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
    await supabase.auth.signOut().catch(() => undefined);
  }

  const response = NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent("Session cleared. Sign in again.")}`,
  );

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}

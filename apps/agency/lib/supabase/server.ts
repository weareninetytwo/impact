import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseAnonKey, readSupabaseUrl } from "./env";

export async function createSupabaseServerClient() {
  const url = readSupabaseUrl();
  const anonKey = readSupabaseAnonKey();
  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* set from Server Component — middleware handles refresh */
        }
      },
    },
  });
}

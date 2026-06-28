import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/** Trim env values; strip accidental unicode from copy-paste (HTTP headers require Latin-1). */
function readEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(/[^\x00-\xFF]/g, "");
}

/** Read env at runtime (dynamic key avoids Next.js build-time inlining of NEXT_PUBLIC_*). */
function readRuntimeEnv(name: string): string | undefined {
  return readEnv(name);
}

function readSupabaseUrl(): string | undefined {
  const url = (
    readRuntimeEnv("SUPABASE_URL") ??
    readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL")
  )?.replace(/\/+$/, "");
  if (!url) return undefined;

  if (url.includes("supabase.com/dashboard") || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(
      "Invalid Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL to Project URL from Supabase Settings → API (https://xxx.supabase.co).",
    );
  }

  return url;
}

/** Browser-safe Supabase client (anon key). */
export function createBrowserClient(): SupabaseClient | null {
  const url = readSupabaseUrl();
  const anonKey = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

/** Server-only Supabase client with service role (bypasses RLS for MVP). */
export function createServerClient(): SupabaseClient | null {
  const url = readSupabaseUrl();
  const serviceKey =
    readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") ??
    readRuntimeEnv("SUPABASE_SECRET_KEY");

  if (!url || !serviceKey) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return serverClient;
}

export function isSupabaseConfigured(): boolean {
  try {
    return Boolean(
      readSupabaseUrl() && readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    );
  } catch {
    return false;
  }
}

/** True when server can persist to Supabase (requires service role). */
export function isSupabasePersistenceEnabled(): boolean {
  try {
    return Boolean(
      readSupabaseUrl() &&
      (readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") ??
        readRuntimeEnv("SUPABASE_SECRET_KEY")),
    );
  } catch {
    return false;
  }
}

export function getPersistenceMode(): "supabase" | "file" {
  return isSupabasePersistenceEnabled() ? "supabase" : "file";
}

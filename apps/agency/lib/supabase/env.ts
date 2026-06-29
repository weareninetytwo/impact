/** Trim env values; strip accidental unicode from copy-paste. */
export function readEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(/[^\x00-\xFF]/g, "");
}

export function readSupabaseUrl(): string | undefined {
  const url = (
    readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL")
  )?.replace(/\/+$/, "");
  if (!url) return undefined;
  if (
    url.includes("supabase.com/dashboard") ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
  ) {
    return undefined;
  }
  return url;
}

export function readSupabaseAnonKey(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(readSupabaseUrl() && readSupabaseAnonKey());
}

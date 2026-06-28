import { createServerClient, isSupabasePersistenceEnabled } from "@impact/db";
import { NextResponse } from "next/server";

/** Safe production diagnostics (no secrets). Protected by basic auth middleware. */
export async function GET() {
  const url =
    process.env["SUPABASE_URL"]?.trim() ||
    process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim() ||
    "";

  const serviceKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim() ||
    process.env["SUPABASE_SECRET_KEY"]?.trim() ||
    "";

  const keyHint = serviceKey.startsWith("eyJ")
    ? "jwt"
    : serviceKey.startsWith("sb_secret_")
      ? "sb_secret"
      : serviceKey.startsWith("sb_publishable_")
        ? "publishable_wrong_slot"
        : serviceKey
          ? "unknown_format"
          : "missing";

  const persistence = isSupabasePersistenceEnabled();
  let supabase: "ok" | "error" = "error";
  let detail = "not configured";

  if (persistence && url) {
    try {
      const client = createServerClient();
      if (!client) {
        detail = "server client not configured";
      } else {
        const { error } = await client
          .from("opportunity_records")
          .select("id", { count: "exact", head: true });
        if (error) {
          detail = error.message;
        } else {
          supabase = "ok";
          detail = "connected";
        }
      }
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    persistence,
    supabase,
    detail,
    keyHint,
    urlHost: url ? new URL(url).host : null,
    vercel: Boolean(process.env.VERCEL),
  });
}

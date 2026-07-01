import { verifyScoutAuth } from "./scout-auth";

/**
 * Scout secret or Vercel CRON_SECRET for scheduled automation runs.
 * Prefer `Authorization: Bearer <secret>` — query `?secret=` is legacy compatibility
 * (may appear in logs/history; avoid for new integrations).
 */
export function verifyAutomationAuth(
  authorizationHeader: string | null,
  querySecret?: string | null,
): boolean {
  if (verifyScoutAuth(authorizationHeader, querySecret)) return true;

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7).trim();
    if (token === cronSecret) return true;
  }

  // Legacy compatibility for cron tools that cannot set headers.
  return querySecret?.trim() === cronSecret;
}

import { verifyScoutAuth } from "./scout-auth";

/** Scout secret or Vercel CRON_SECRET for scheduled automation runs. */
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

  return querySecret?.trim() === cronSecret;
}

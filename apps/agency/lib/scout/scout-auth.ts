/** Verify Bearer token for scheduled scout cron (server-only). */
export function verifyScoutAuth(
  authorizationHeader: string | null,
  querySecret?: string | null,
): boolean {
  const secret = process.env.IMPACT_SCOUT_SECRET?.trim();
  if (!secret) return false;

  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7).trim();
    if (token.length > 0 && token === secret) return true;
  }

  if (querySecret?.trim() === secret) return true;

  return false;
}

export function isScoutCronConfigured(): boolean {
  return Boolean(process.env.IMPACT_SCOUT_SECRET?.trim());
}

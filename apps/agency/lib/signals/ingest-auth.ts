/** Verify Bearer token for signal ingest API (server-only). */
export function verifyIngestAuth(
  authorizationHeader: string | null,
): boolean {
  const secret = process.env.IMPACT_INGEST_SECRET?.trim();
  if (!secret) return false;
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 && token === secret;
}

export function isIngestConfigured(): boolean {
  return Boolean(process.env.IMPACT_INGEST_SECRET?.trim());
}

export interface HealthDiagnostics {
  persistence: boolean;
  supabase: "ok" | "error";
  detail: string;
  keyHint: string;
  urlHost: string | null;
  vercel: boolean;
}

/** Strip anything that reveals infrastructure unless the caller is authorized. */
export function buildHealthResponse(
  diagnostics: HealthDiagnostics,
  privileged: boolean,
): Partial<HealthDiagnostics> {
  if (privileged) return diagnostics;
  return { persistence: diagnostics.persistence, supabase: diagnostics.supabase };
}

import { getAuthPlaceholder } from "./placeholder";

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  role: "owner" | "admin" | "bd_rep" | "viewer";
}

/** Auth session — placeholder until Supabase Auth is wired. */
export async function getAuthSession(): Promise<AuthSession> {
  return getAuthPlaceholder();
}

export function isAuthGuardEnabled(): boolean {
  return Boolean(process.env.IMPACT_BASIC_AUTH_PASSWORD);
}

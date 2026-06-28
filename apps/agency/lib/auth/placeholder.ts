/** Placeholder auth session — Epic 2 will wire Supabase Auth */
export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  role: "owner" | "admin" | "bd_rep" | "viewer";
}

export function getAuthPlaceholder(): AuthSession {
  return {
    userId: "00000000-0000-4000-8000-000000000099",
    email: "demo@ninetytwo.com",
    fullName: "Demo User",
    tenantId: "00000000-0000-4000-8000-000000000001",
    tenantName: "ninety two",
    role: "owner",
  };
}

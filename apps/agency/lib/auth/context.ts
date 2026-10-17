import { getTenantId } from "@impact/shared";
import { getAuthSession } from "@/lib/auth/session";

export interface RequestContext {
  tenantId: string;
  userId: string | null;
  role: "owner" | "admin" | "bd_rep" | "viewer";
}

export async function getRequestContext(): Promise<RequestContext> {
  const session = await getAuthSession();
  return {
    tenantId: session?.tenantId ?? getTenantId(),
    userId: session?.userId ?? null,
    role: session?.role ?? "owner",
  };
}

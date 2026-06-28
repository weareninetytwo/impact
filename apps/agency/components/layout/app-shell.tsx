import { getAuthSession } from "@/lib/auth/session";
import { getDeploymentInfo } from "@/lib/deployment";
import { MobileShell } from "./mobile-shell";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  const deployment = getDeploymentInfo();

  const authLabel = deployment.basicAuthEnabled
    ? "Basic auth"
    : deployment.persistenceMode === "supabase"
      ? "Supabase"
      : "Local file";

  return (
    <MobileShell
      tenantName={session.tenantName}
      userLabel={`${session.fullName} · ${session.role}`}
      authLabel={authLabel}
    >
      {children}
    </MobileShell>
  );
}

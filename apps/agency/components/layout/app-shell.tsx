import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { isSupabaseAuthEnabled } from "@/lib/supabase/env";
import { getDeploymentInfo } from "@/lib/deployment";
import { UserMenu } from "./user-menu";
import { MobileShell } from "./mobile-shell";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  const authEnabled = isSupabaseAuthEnabled();

  if (authEnabled && !session) {
    redirect("/login");
  }

  const deployment = getDeploymentInfo();
  const tenantName = session?.tenantName ?? "Impact";
  const showDevHint =
    !authEnabled && !deployment.basicAuthEnabled;

  return (
    <MobileShell
      tenantName={tenantName}
      userMenu={
        session ? (
          <UserMenu
            fullName={session.fullName}
            role={session.role}
            email={session.email}
          />
        ) : showDevHint ? (
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Local dev — auth disabled
          </span>
        ) : null
      }
    >
      {children}
    </MobileShell>
  );
}

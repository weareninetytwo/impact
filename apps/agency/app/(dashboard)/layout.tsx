import { AppShell } from "@/components/layout/app-shell";

/** Live data from Supabase/file store — do not prerender at build time. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

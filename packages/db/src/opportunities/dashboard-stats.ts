import type { DashboardStats, Opportunity, SignalImport } from "@impact/shared";

/** Closed stages excluded from open pipeline counts and value sums. */
export const DASHBOARD_CLOSED_STAGES = ["won", "lost", "skip"] as const;

/**
 * Stages counted under "Contact needed" on the dashboard.
 * Includes explicit contact_needed plus reviewed (awaiting contact research).
 */
export const DASHBOARD_CONTACT_NEEDED_STAGES = [
  "contact_needed",
  "reviewed",
] as const;

function isOpenStage(stage: Opportunity["stage"]): boolean {
  return !(DASHBOARD_CLOSED_STAGES as readonly string[]).includes(stage);
}

function filterByTenant<T extends { tenant_id: string }>(
  items: T[],
  tenantId?: string,
): T[] {
  if (!tenantId) return items;
  return items.filter((item) => item.tenant_id === tenantId);
}

export function countPendingReviewSignals(
  imports: SignalImport[],
  tenantId?: string,
): number {
  return filterByTenant(imports, tenantId).filter(
    (record) => record.status === "pending",
  ).length;
}

export function computeDashboardStats(
  opportunities: Opportunity[],
  tenantId?: string,
): DashboardStats {
  const scoped = filterByTenant(opportunities, tenantId);
  const open = scoped.filter((o) => isOpenStage(o.stage));

  return {
    total: open.length,
    new_count: scoped.filter((o) => o.stage === "new").length,
    a_grade: open.filter((o) => o.lead_grade === "A").length,
    ready_for_outreach: scoped.filter((o) => o.stage === "ready_for_outreach")
      .length,
    needs_contact: scoped.filter((o) =>
      (DASHBOARD_CONTACT_NEEDED_STAGES as readonly string[]).includes(o.stage),
    ).length,
    nurturing_count: scoped.filter((o) => o.stage === "nurturing").length,
    in_proposal: scoped.filter((o) => o.stage === "proposal").length,
    open_estimated_pipeline: open.reduce(
      (sum, o) => sum + (o.estimated_value ?? 0),
      0,
    ),
  };
}

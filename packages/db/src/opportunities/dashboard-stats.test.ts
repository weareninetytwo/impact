import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Opportunity, SignalImport } from "@impact/shared";
import {
  computeDashboardStats,
  countPendingReviewSignals,
} from "./dashboard-stats";

const TENANT_A = "tenant-a";
const TENANT_B = "tenant-b";

function makeOpportunity(
  overrides: Partial<Opportunity> & Pick<Opportunity, "id" | "stage">,
): Opportunity {
  return {
    tenant_id: TENANT_A,
    company_name: "Acme",
    company_website: null,
    title: "Test opp",
    lead_grade: "B",
    signal_type: "news",
    source: "test",
    source_url: null,
    signal_summary: null,
    deadline: null,
    estimated_value: 100_000,
    fit_score: 70,
    urgency_score: 70,
    value_score: 70,
    confidence_score: 70,
    total_score: 70,
    next_action: "Review",
    recommended_action: "Review",
    notes: null,
    owner_user_id: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeImport(
  overrides: Partial<SignalImport> & Pick<SignalImport, "id">,
): SignalImport {
  return {
    tenant_id: TENANT_A,
    company_name: "Acme",
    opportunity_title: "Signal",
    signal_type: "news",
    signal_summary: null,
    source_name: null,
    source_url: null,
    deadline: null,
    estimated_value: null,
    location: null,
    fit_score: null,
    fit_notes: null,
    recommended_action: null,
    raw_text: null,
    status: "pending",
    matched_opportunity_id: null,
    created_opportunity_id: null,
    created_knowledge_id: null,
    import_source: "api",
    raw_payload: null,
    created_at: "2026-06-01T00:00:00.000Z",
    reviewed_at: null,
    ...overrides,
  };
}

describe("computeDashboardStats", () => {
  it("excludes other-tenant opportunities from tenant-scoped stats", () => {
    const opportunities = [
      makeOpportunity({ id: "a-new", stage: "new" }),
      makeOpportunity({ id: "b-new", stage: "new", tenant_id: TENANT_B }),
      makeOpportunity({ id: "a-won", stage: "won" }),
    ];

    const stats = computeDashboardStats(opportunities, TENANT_A);

    assert.equal(stats.new_count, 1);
    assert.equal(stats.total, 1);
    assert.equal(stats.open_estimated_pipeline, 100_000);
  });

  it("counts nurturing opportunities", () => {
    const opportunities = [
      makeOpportunity({ id: "bills", stage: "nurturing" }),
      makeOpportunity({ id: "other", stage: "ready_for_outreach" }),
    ];

    const stats = computeDashboardStats(opportunities, TENANT_A);

    assert.equal(stats.nurturing_count, 1);
  });

  it("counts in proposal using stage === proposal", () => {
    const opportunities = [
      makeOpportunity({ id: "rfp", stage: "proposal" }),
      makeOpportunity({ id: "new", stage: "new" }),
    ];

    const stats = computeDashboardStats(opportunities, TENANT_A);

    assert.equal(stats.in_proposal, 1);
  });

  it("excludes won, lost, and skip from open estimated pipeline", () => {
    const opportunities = [
      makeOpportunity({
        id: "open",
        stage: "new",
        estimated_value: 50_000,
      }),
      makeOpportunity({
        id: "won",
        stage: "won",
        estimated_value: 1_000_000,
      }),
      makeOpportunity({
        id: "lost",
        stage: "lost",
        estimated_value: 900_000,
      }),
      makeOpportunity({
        id: "skip",
        stage: "skip",
        estimated_value: 800_000,
      }),
    ];

    const stats = computeDashboardStats(opportunities, TENANT_A);

    assert.equal(stats.open_estimated_pipeline, 50_000);
    assert.equal(stats.total, 1);
  });
});

describe("countPendingReviewSignals", () => {
  it("counts only current pending imports for the tenant", () => {
    const imports = [
      makeImport({ id: "pending-a", status: "pending" }),
      makeImport({
        id: "pending-b",
        status: "pending",
        tenant_id: TENANT_B,
      }),
      makeImport({ id: "skipped", status: "skipped" }),
    ];

    assert.equal(countPendingReviewSignals(imports, TENANT_A), 1);
  });

  it("stays separate from last watch queued_count semantics", () => {
    const imports = [makeImport({ id: "pending-a", status: "pending" })];
    const lastWatchQueuedCount = 42;

    assert.equal(countPendingReviewSignals(imports, TENANT_A), 1);
    assert.notEqual(countPendingReviewSignals(imports, TENANT_A), lastWatchQueuedCount);
  });
});

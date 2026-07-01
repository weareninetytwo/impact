import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { AutomationRunSummary } from "@impact/shared";
import { handleAutomationRun } from "./automation-run";

const SCOUT = "scout-route-test-secret";

function snapshotEnv(): { scout?: string; cron?: string } {
  return {
    scout: process.env.IMPACT_SCOUT_SECRET,
    cron: process.env.CRON_SECRET,
  };
}

function restoreEnv(before: { scout?: string; cron?: string }): void {
  if (before.scout === undefined) delete process.env.IMPACT_SCOUT_SECRET;
  else process.env.IMPACT_SCOUT_SECRET = before.scout;
  if (before.cron === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = before.cron;
}

function mockSummary(): AutomationRunSummary {
  return {
    started_at: "2026-06-29T12:00:00.000Z",
    finished_at: "2026-06-29T12:01:00.000Z",
    scout_sources_run: 1,
    imports_approved: 0,
    imports_skipped: 0,
    opportunities_processed: 2,
    research_generated: 2,
    qualified: 1,
    briefs_generated: 1,
    nurture_enrolled: 0,
    proposals_generated: 1,
    tasks_created: 3,
    outreach_drafts_prepared: 1,
    briefing: "Test briefing",
    errors: [],
  };
}

describe("handleAutomationRun", () => {
  let envBefore: ReturnType<typeof snapshotEnv>;

  afterEach(() => {
    restoreEnv(envBefore);
  });

  it("GET without authorization returns 401", async () => {
    envBefore = snapshotEnv();
    delete process.env.IMPACT_SCOUT_SECRET;
    delete process.env.CRON_SECRET;

    const response = await handleAutomationRun(
      new Request("http://localhost/api/automation/run"),
    );
    const body = (await response.json()) as { error: string };

    assert.equal(response.status, 401);
    assert.match(body.error, /Unauthorized/i);
    assert.doesNotMatch(body.error, /scout-route-test-secret/);
  });

  it("POST without authorization returns 401", async () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;

    const response = await handleAutomationRun(
      new Request("http://localhost/api/automation/run", { method: "POST" }),
    );

    assert.equal(response.status, 401);
  });

  it("valid Bearer authorization reaches the pipeline execution path", async () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;

    let pipelineCalled = false;
    const response = await handleAutomationRun(
      new Request("http://localhost/api/automation/run", {
        headers: { authorization: `Bearer ${SCOUT}` },
      }),
      async () => {
        pipelineCalled = true;
        return mockSummary();
      },
    );
    const body = (await response.json()) as AutomationRunSummary;

    assert.equal(response.status, 200);
    assert.equal(pipelineCalled, true);
    assert.equal(body.opportunities_processed, 2);
  });

  it("pipeline failure returns explicit error instead of false success", async () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;

    const response = await handleAutomationRun(
      new Request("http://localhost/api/automation/run", {
        headers: { authorization: `Bearer ${SCOUT}` },
      }),
      async () => {
        throw new Error("Pipeline exploded");
      },
    );
    const body = (await response.json()) as { error: string };

    assert.equal(response.status, 500);
    assert.equal(body.error, "Pipeline exploded");
    assert.doesNotMatch(body.error, /scout-route-test-secret/);
  });
});

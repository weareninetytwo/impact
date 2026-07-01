import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { verifyAutomationAuth } from "./automation-auth";

const SCOUT = "scout-secret-for-tests";
const CRON = "cron-secret-for-tests";

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

describe("verifyAutomationAuth", () => {
  let envBefore: ReturnType<typeof snapshotEnv>;

  afterEach(() => {
    restoreEnv(envBefore);
  });

  it("rejects when no secret is supplied", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth(null, null), false);
    assert.equal(verifyAutomationAuth("", undefined), false);
  });

  it("rejects incorrect Bearer token", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth("Bearer wrong-token", null), false);
    assert.equal(verifyAutomationAuth("Bearer ", null), false);
  });

  it("accepts valid IMPACT_SCOUT_SECRET Bearer token", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth(`Bearer ${SCOUT}`, null), true);
  });

  it("accepts valid CRON_SECRET Bearer token", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth(`Bearer ${CRON}`, null), true);
  });

  it("accepts supported query-secret path for compatibility", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth(null, SCOUT), true);
    assert.equal(verifyAutomationAuth(null, CRON), true);
  });

  it("rejects when relevant environment variables are empty", () => {
    envBefore = snapshotEnv();
    delete process.env.IMPACT_SCOUT_SECRET;
    delete process.env.CRON_SECRET;

    assert.equal(verifyAutomationAuth(`Bearer ${SCOUT}`, SCOUT), false);
    assert.equal(verifyAutomationAuth(`Bearer ${CRON}`, CRON), false);
  });

  it("does not accept scout token when only CRON_SECRET is configured", () => {
    envBefore = snapshotEnv();
    delete process.env.IMPACT_SCOUT_SECRET;
    process.env.CRON_SECRET = CRON;

    assert.equal(verifyAutomationAuth(`Bearer ${SCOUT}`, null), false);
    assert.equal(verifyAutomationAuth(`Bearer ${CRON}`, null), true);
  });

  it("does not accept cron token when only IMPACT_SCOUT_SECRET is configured", () => {
    envBefore = snapshotEnv();
    process.env.IMPACT_SCOUT_SECRET = SCOUT;
    delete process.env.CRON_SECRET;

    assert.equal(verifyAutomationAuth(`Bearer ${CRON}`, null), false);
    assert.equal(verifyAutomationAuth(`Bearer ${SCOUT}`, null), true);
  });
});

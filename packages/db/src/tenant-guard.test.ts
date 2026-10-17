import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_TENANT_ID,
  getTenantId,
  resetTenantResolver,
  setTenantResolver,
} from "@impact/shared";

const ROOT = join(__dirname, "..", "..", "..");
const ALLOWED = new Set([
  "packages/shared/src/types/opportunity.ts", // definition
  "packages/shared/src/tenant.ts", // the seam
  "packages/db/src/tenant-guard.test.ts", // this test
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("tenant seam", () => {
  afterEach(() => resetTenantResolver());

  it("defaults to the ninety two tenant", () => {
    assert.equal(getTenantId(), DEFAULT_TENANT_ID);
  });

  it("can be swapped without touching call sites", () => {
    setTenantResolver(() => "tenant-b");
    assert.equal(getTenantId(), "tenant-b");
    resetTenantResolver();
    assert.equal(getTenantId(), DEFAULT_TENANT_ID);
  });

  it("no source file reads DEFAULT_TENANT_ID directly (use getTenantId)", () => {
    const offenders = [...walk(join(ROOT, "packages")), ...walk(join(ROOT, "apps"))]
      .map((f) => relative(ROOT, f))
      .filter((f) => !ALLOWED.has(f))
      .filter((f) => readFileSync(join(ROOT, f), "utf8").includes("DEFAULT_TENANT_ID"));
    assert.deepEqual(offenders, []);
  });
});

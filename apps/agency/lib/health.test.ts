import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHealthResponse } from "./health";

const full = {
  persistence: true,
  supabase: "error" as const,
  detail: 'relation "opportunity_records" does not exist',
  keyHint: "jwt",
  urlHost: "abc.supabase.co",
  vercel: true,
};

describe("health response", () => {
  it("hides infrastructure details from anonymous callers", () => {
    const r = buildHealthResponse(full, false);
    assert.deepEqual(Object.keys(r).sort(), ["persistence", "supabase"]);
    assert.ok(!JSON.stringify(r).includes("supabase.co"));
  });

  it("returns everything to authorized callers", () => {
    assert.deepEqual(buildHealthResponse(full, true), full);
  });
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { SIGNAL_TYPES } from "@impact/shared";
import { scoreOpportunity, type ScoringInput } from "./scoring";

/**
 * Characterization test: pins today's ninety two scoring behavior so the
 * per-industry config refactor (and any later pack) cannot change it silently.
 * The hash covers a full matrix; the examples below are the readable subset.
 */

const FIXED_NOW = Date.parse("2026-01-15T12:00:00Z");
const DAY = 86_400_000;

const VALUES: (number | null)[] = [null, 0, 4999, 5000, 10000, 25000, 50000, 100000, 150000];
const DEADLINES: (string | null)[] = [
  null,
  "not-a-date",
  new Date(FIXED_NOW - 3 * DAY).toISOString(),
  new Date(FIXED_NOW + 3 * DAY).toISOString(),
  new Date(FIXED_NOW + 10 * DAY).toISOString(),
  new Date(FIXED_NOW + 20 * DAY).toISOString(),
  new Date(FIXED_NOW + 60 * DAY).toISOString(),
  new Date(FIXED_NOW + 200 * DAY).toISOString(),
];
const TEXTS: { title: string; summary: string | null; notes: string | null }[] = [
  { title: "Plain lead", summary: null, notes: null },
  { title: "Rebrand and website rollout", summary: "New brand identity, signage and fleet", notes: null },
  { title: "Logo only job", summary: "free spec work for a student", notes: "print only" },
  { title: "Interested", summary: "no budget yet", notes: "tire kicker" },
];
const COMPLETENESS = [
  {},
  {
    company_website: "https://example.com",
    source_url: "https://example.com/rfp",
  },
];

function matrix(): ScoringInput[] {
  const out: ScoringInput[] = [];
  for (const { value: signal_type } of SIGNAL_TYPES) {
    for (const estimated_value of VALUES) {
      for (const deadline of DEADLINES) {
        for (const text of TEXTS) {
          for (const extra of COMPLETENESS) {
            out.push({
              company_name: "Acme",
              title: text.title,
              signal_type,
              signal_summary: text.summary,
              notes: text.notes,
              estimated_value,
              deadline,
              ...extra,
            } as ScoringInput);
          }
        }
      }
    }
  }
  return out;
}

const realNow = Date.now;
before(() => {
  Date.now = () => FIXED_NOW;
});
after(() => {
  Date.now = realNow;
});

describe("scoreOpportunity golden behavior (ninety two default)", () => {
  it("matches the pinned hash across the full input matrix", () => {
    const inputs = matrix();
    const results = inputs.map((i) => scoreOpportunity(i));
    const hash = createHash("sha256").update(JSON.stringify(results)).digest("hex");
    assert.equal(inputs.length, 10 * 9 * 8 * 4 * 2);
    assert.equal(hash, "14d1059c46d1442a3769b6c53806d13e56eb7552b48bec480f85a7cda965f644");
  });

  it("scores a strong RFP as an A with the enterprise offer", () => {
    const r = scoreOpportunity({
      company_name: "City of Example",
      title: "Citywide wayfinding signage RFP",
      signal_type: "rfp",
      signal_summary: "Public bid for rollout signage",
      source_url: "https://example.gov/bid",
      company_website: "https://example.gov",
      estimated_value: 120000,
      deadline: new Date(FIXED_NOW + 10 * DAY).toISOString(),
    } as ScoringInput);
    assert.equal(r.lead_grade, "A");
    assert.match(r.recommended_action, /Custom Enterprise \/ RFP Pursuit/);
    assert.equal(r.suggested_stage, "ready_for_outreach");
  });

  it("grades a sub-$5k lead D regardless of fit", () => {
    const r = scoreOpportunity({
      company_name: "Tiny",
      title: "Rebrand",
      signal_type: "rfp",
      estimated_value: 4000,
    } as ScoringInput);
    assert.equal(r.lead_grade, "D");
    assert.equal(r.suggested_stage, "skip");
  });

  it("grades a typeless lead C and routes it to nurture", () => {
    const r = scoreOpportunity({
      company_name: "Misc",
      title: "Hello",
      signal_type: "other",
      estimated_value: 60000,
      deadline: new Date(FIXED_NOW + 5 * DAY).toISOString(),
    } as ScoringInput);
    // "other" has fit 50, so it can never reach A/B; the offer surfaces in the C action text
    assert.equal(r.lead_grade, "C");
    assert.match(r.recommended_action, /nurture/i);
    assert.equal(r.suggested_stage, "nurturing");
  });

  it("routes every signal type to its configured offer on an A-grade lead", () => {
    const expected: Record<string, string> = {
      rfp: "Custom Enterprise / RFP Pursuit",
      expansion: "Brand Rollout Package",
      signage: "Signage + Environmental Graphics",
      website_redesign: "Website Audit / Redesign Sprint",
      funding: "Brand Strategy Sprint",
      agency_partner: "White-label Partner Program",
    };
    for (const [signal_type, offer] of Object.entries(expected)) {
      const r = scoreOpportunity({
        company_name: "Acme",
        title: "Rebrand and signage rollout",
        signal_type,
        signal_summary: "brand identity",
        company_website: "https://acme.example",
        source_url: "https://acme.example/news",
        estimated_value: 120000,
        deadline: new Date(FIXED_NOW + 5 * DAY).toISOString(),
      } as ScoringInput);
      assert.equal(r.lead_grade, "A", signal_type);
      assert.ok(r.recommended_action.endsWith(offer), `${signal_type}: ${r.recommended_action}`);
    }
  });
});

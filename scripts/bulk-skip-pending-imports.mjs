#!/usr/bin/env node
/**
 * Skip all pending signal imports (clears noisy Scout queue).
 * Run from repo root: node scripts/bulk-skip-pending-imports.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");
const DEFAULT_TENANT_ID = "00000000-0000-4000-8000-000000000001";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envPath);

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
  /\/+$/,
  "",
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase URL or service role key in apps/agency/.env.local");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  Prefer: "return=representation",
};

async function countPending() {
  const res = await fetch(
    `${url}/rest/v1/signal_imports?tenant_id=eq.${DEFAULT_TENANT_ID}&status=eq.pending&select=id`,
    { headers: { ...headers, Prefer: "count=exact" } },
  );
  const countHeader = res.headers.get("content-range");
  if (countHeader) {
    const match = countHeader.match(/\/(\d+)$/);
    if (match) return Number.parseInt(match[1], 10);
  }
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

async function skipAllPending() {
  const reviewedAt = new Date().toISOString();
  const res = await fetch(
    `${url}/rest/v1/signal_imports?tenant_id=eq.${DEFAULT_TENANT_ID}&status=eq.pending`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "skipped", reviewed_at: reviewedAt }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Skip failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

async function listOutreachQueue() {
  const res = await fetch(
    `${url}/rest/v1/opportunity_records?tenant_id=eq.${DEFAULT_TENANT_ID}&lead_grade=in.(A,B,C)&stage=not.in.(won,lost,skip)&select=company_name,title,lead_grade,stage,total_score&order=lead_grade.asc,total_score.desc`,
    { headers },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List opps failed (${res.status}): ${text}`);
  }
  return res.json();
}

const pendingBefore = await countPending();
console.log(`Pending imports before: ${pendingBefore}`);

if (pendingBefore === 0) {
  console.log("Nothing to skip.");
} else {
  const skipped = await skipAllPending();
  console.log(`Skipped: ${skipped}`);
}

const pendingAfter = await countPending();
console.log(`Pending imports after: ${pendingAfter}`);

const queue = await listOutreachQueue();
console.log(`\nOutreach queue (A/B/C): ${queue.length} opportunities`);
for (const opp of queue.slice(0, 15)) {
  console.log(
    `  [${opp.lead_grade}] ${opp.company_name} — ${opp.title} (${opp.stage}) score=${opp.total_score}`,
  );
}
if (queue.length > 15) {
  console.log(`  … and ${queue.length - 15} more`);
}

console.log("\nDone. Deploy then open https://impact.weareninetytwo.xyz/outreach");

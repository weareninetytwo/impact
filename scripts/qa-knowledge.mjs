#!/usr/bin/env node
/**
 * Epic 2.5 Knowledge Engine QA
 * Usage: node scripts/qa-knowledge.mjs
 * Requires apps/agency/.env.local with Supabase + optional basic auth.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(resolve(root, "apps/agency/.env.local"));

const url = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const authPassword = (process.env.IMPACT_BASIC_AUTH_PASSWORD || "").trim();
const prodBase = "https://impact-rosy.vercel.app";

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function supabaseFetch(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json, text };
}

async function checkTables() {
  for (const table of [
    "knowledge_items",
    "knowledge_chunks",
    "opportunity_knowledge_links",
  ]) {
    const { res, text } = await supabaseFetch(`${table}?select=id&limit=1`);
    if (res.status === 200) pass(`Table ${table} exists`);
    else fail(`Table ${table} exists`, `${res.status}: ${text.slice(0, 120)}`);
  }
}

async function createTestKnowledge() {
  const content = `Web process (QA test):
1. Discovery call and goals alignment
2. Sitemap and wireframes
3. Design review and approval
4. Development in staging
5. QA, launch, and 30-day support

Rates: Design $150/hr, Development $175/hr, Strategy $200/hr.`;

  const { res, json, text } = await supabaseFetch("knowledge_items", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      title: "QA Test — Web Process & Rates",
      type: "sop",
      source: "automated-qa",
      tags: ["qa", "web", "rates"],
      summary: "Automated Epic 2.5 QA item",
      content_text: content,
      chunk_count: 0,
    }),
  });

  if (!res.ok) {
    fail("Create knowledge item", `${res.status}: ${text.slice(0, 200)}`);
    return null;
  }

  const item = Array.isArray(json) ? json[0] : json;
  pass("Create knowledge item", item.id);

  const chunks = content
    .split(/\n\n+/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((content, chunk_index) => ({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      knowledge_item_id: item.id,
      chunk_index,
      content,
    }));

  const chunkRes = await supabaseFetch("knowledge_chunks", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(chunks),
  });

  if (!chunkRes.res.ok) {
    fail("Create knowledge chunks", chunkRes.text.slice(0, 200));
  } else {
    pass("Create knowledge chunks", `${chunks.length} chunks`);
    await supabaseFetch(`knowledge_items?id=eq.${item.id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ chunk_count: chunks.length }),
    });
  }

  return item;
}

function keywordAnswer(question, chunks, itemsById) {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const chunk of chunks) {
    const lower = chunk.content.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (lower.includes(term)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = { chunk, item: itemsById.get(chunk.knowledge_item_id) };
    }
  }
  return bestScore > 0 ? best : null;
}

async function askQuestion(itemId) {
  const { res, json } = await supabaseFetch(
    `knowledge_chunks?knowledge_item_id=eq.${itemId}&select=*`,
  );
  if (!res.ok) {
    fail("Keyword retrieval", "could not load chunks");
    return;
  }
  const { json: items } = await supabaseFetch(
    `knowledge_items?id=eq.${itemId}&select=id,title,type`,
  );
  const itemsById = new Map((items || []).map((i) => [i.id, i]));
  const hit = keywordAnswer("what rates do we use?", json || [], itemsById);
  if (hit?.chunk.content.includes("$150")) {
    pass("Keyword retrieval", `matched "${hit.item?.title}"`);
  } else {
    fail("Keyword retrieval", "no grounded match");
  }
}

async function linkToOpportunity(knowledgeItemId) {
  const { res, json } = await supabaseFetch(
    "opportunity_records?select=id,title&limit=1",
  );
  if (!res.ok || !json?.length) {
    fail("Link to opportunity", "no opportunities found — create one first");
    return;
  }
  const opp = json[0];
  const linkRes = await supabaseFetch("opportunity_knowledge_links", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      opportunity_id: opp.id,
      knowledge_item_id: knowledgeItemId,
    }),
  });
  if (linkRes.res.ok) {
    pass("Link to opportunity", `${opp.title || opp.id}`);
  } else if (linkRes.text.includes("duplicate") || linkRes.res.status === 409) {
    pass("Link to opportunity", "already linked");
  } else {
    fail("Link to opportunity", linkRes.text.slice(0, 200));
  }
}

async function verifyRows(itemId) {
  const checks = [
    [`knowledge_items?id=eq.${itemId}&select=id`, 1],
    [`knowledge_chunks?knowledge_item_id=eq.${itemId}&select=id`, 1],
    [
      `opportunity_knowledge_links?knowledge_item_id=eq.${itemId}&select=id`,
      0,
    ],
  ];
  for (const [path, min] of checks) {
    const { res, json } = await supabaseFetch(`${path}`);
    const count = Array.isArray(json) ? json.length : 0;
    const table = path.split("?")[0];
    if (res.ok && count >= min) pass(`Supabase rows: ${table}`, `${count} row(s)`);
    else fail(`Supabase rows: ${table}`, `expected >=${min}, got ${count}`);
  }
}

async function checkProductionRoutes() {
  if (!authPassword) {
    fail("Production routes", "IMPACT_BASIC_AUTH_PASSWORD not set");
    return;
  }
  const auth = Buffer.from(`impact:${authPassword}`).toString("base64");
  for (const route of ["/knowledge", "/knowledge/new", "/knowledge/ask"]) {
    const res = await fetch(`${prodBase}${route}`, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: "manual",
    });
    if (res.status === 200) pass(`Production ${route}`, "200 OK");
    else fail(`Production ${route}`, `status ${res.status}`);
  }
}

async function main() {
  console.log("\nEpic 2.5 Knowledge QA\n");

  if (!url || !key) {
    console.log("Missing Supabase credentials in apps/agency/.env.local\n");
    console.log("Fill these 4 lines, save, then run: node scripts/qa-knowledge.mjs\n");
    console.log("  NEXT_PUBLIC_SUPABASE_URL=https://lyajhahbmpjzkrovseeu.supabase.co");
    console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...");
    console.log("  SUPABASE_SERVICE_ROLE_KEY=eyJ...");
    console.log("  IMPACT_BASIC_AUTH_PASSWORD=...\n");
    process.exit(1);
  }

  pass("Supabase credentials loaded", new URL(url).host);

  await checkTables();
  const item = await createTestKnowledge();
  if (item) {
    await askQuestion(item.id);
    await linkToOpportunity(item.id);
    await verifyRows(item.id);
  }
  await checkProductionRoutes();

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

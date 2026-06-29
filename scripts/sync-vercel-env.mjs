#!/usr/bin/env node
/**
 * Sync apps/agency/.env.local → Vercel Production, then redeploy.
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");

const SYNC_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "IMPACT_DEFAULT_TENANT_SLUG",
  "IMPACT_INGEST_SECRET",
  "IMPACT_SCOUT_SECRET",
  "IMPACT_BASIC_AUTH_PASSWORD",
];

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

if (!existsSync(envPath)) {
  console.error("Missing apps/agency/.env.local");
  process.exit(1);
}

const vars = parseEnv(readFileSync(envPath, "utf8"));
const vercel = "npx vercel";

function vercelExec(args, input) {
  execSync(`${vercel} ${args}`, {
    cwd: root,
    input,
    stdio: input !== undefined ? ["pipe", "inherit", "inherit"] : "inherit",
  });
}

console.log("Syncing env to Vercel Production…");
for (const key of SYNC_KEYS) {
  const value = vars[key] ?? "";
  try {
    execSync(`${vercel} env rm ${key} production -y`, { cwd: root, stdio: "ignore" });
  } catch {
    /* var may not exist */
  }
  if (!value) {
    console.log(`  skip ${key} (empty)`);
    continue;
  }
  vercelExec(`env add ${key} production`, value);
  console.log(`  ✓ ${key}`);
}

console.log("\nRedeploying production…");
vercelExec("deploy --prod --yes");
console.log("\nDone.");

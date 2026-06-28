#!/usr/bin/env node
/**
 * Reads apps/agency/.env.local and pushes vars to Vercel Production, then redeploys.
 * Usage: node scripts/push-vercel-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "IMPACT_BASIC_AUTH_PASSWORD",
];

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
  }
  return vars;
}

if (!existsSync(envPath)) {
  console.error("Missing apps/agency/.env.local — fill in the 4 variables first.");
  process.exit(1);
}

const vars = parseEnv(readFileSync(envPath, "utf8"));
const missing = REQUIRED.filter((k) => !vars[k]?.trim());
if (missing.length) {
  console.error("Missing or empty in .env.local:", missing.join(", "));
  process.exit(1);
}

console.log("Pushing env vars to Vercel (Production)…");
for (const key of REQUIRED) {
  execSync(`npx vercel env rm ${key} production -y 2>/dev/null || true`, {
    cwd: root,
    stdio: "ignore",
  });
  execSync(`npx vercel env add ${key} production`, {
    cwd: root,
    input: vars[key],
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`  ✓ ${key}`);
}

console.log("\nDeploying to production…");
execSync("npx vercel deploy --prod --yes", { cwd: root, stdio: "inherit" });
console.log("\nDone. Open https://impact-rosy.vercel.app on your phone.");

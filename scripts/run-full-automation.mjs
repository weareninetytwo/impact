#!/usr/bin/env node
/** Run full automation pipeline against production Supabase */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");

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

const secret = process.env.IMPACT_SCOUT_SECRET;
const base =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  "https://impact.weareninetytwo.xyz";

if (!secret) {
  console.error("Missing IMPACT_SCOUT_SECRET");
  process.exit(1);
}

console.log(`Triggering ${base}/api/automation/run …`);
const res = await fetch(`${base}/api/automation/run?secret=${encodeURIComponent(secret)}`, {
  method: "POST",
});

const body = await res.text();
console.log(`Status: ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(body), null, 2));
} catch {
  console.log(body);
}

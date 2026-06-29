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

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
  /\/+$/,
  "",
);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const checks = [
  { name: "users", path: "users?select=id&limit=1" },
  { name: "opportunity_watch_runs", path: "opportunity_watch_runs?select=id&limit=1" },
  {
    name: "opportunity_records.owner_user_id",
    path: "opportunity_records?select=owner_user_id&limit=1",
  },
  {
    name: "signal_imports.owner_user_id",
    path: "signal_imports?select=owner_user_id&limit=1",
  },
  { name: "scout_sources", path: "scout_sources?select=id&limit=1" },
  { name: "scout_runs", path: "scout_runs?select=id&limit=1" },
];

let failed = 0;
for (const check of checks) {
  const res = await fetch(`${url}/rest/v1/${check.path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (res.ok) {
    console.log(`OK: ${check.name}`);
  } else {
    const body = await res.text();
    console.log(`MISSING: ${check.name} (${res.status}) ${body.slice(0, 120)}`);
    failed++;
  }
}

process.exit(failed > 0 ? 2 : 0);

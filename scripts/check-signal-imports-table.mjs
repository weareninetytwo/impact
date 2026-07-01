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
  console.error("Missing Supabase URL or service role key in apps/agency/.env.local");
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/signal_imports?select=id&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  },
});

if (res.ok) {
  const rows = await res.json();
  console.log(`OK: signal_imports exists (sample rows: ${rows.length})`);
  process.exit(0);
}

const body = await res.text();
if (res.status === 404 || body.includes("PGRST205") || body.includes("does not exist")) {
  console.log("MISSING: signal_imports table not found");
  process.exit(2);
}

console.error(`ERROR ${res.status}:`, body);
process.exit(1);

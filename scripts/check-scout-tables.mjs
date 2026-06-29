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

async function checkTable(name) {
  const res = await fetch(`${url}/rest/v1/${name}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  if (res.ok) {
    const rows = await res.json();
    console.log(`OK: ${name} exists (sample rows: ${rows.length})`);
    return true;
  }

  const body = await res.text();
  if (res.status === 404 || body.includes("PGRST205") || body.includes("does not exist")) {
    console.log(`MISSING: ${name} table not found`);
    return false;
  }

  console.error(`ERROR ${name} ${res.status}:`, body);
  return false;
}

const sourcesOk = await checkTable("scout_sources");
const runsOk = await checkTable("scout_runs");
process.exit(sourcesOk && runsOk ? 0 : 2);

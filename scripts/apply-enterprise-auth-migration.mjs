import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");
const sqlPath = resolve(
  root,
  "packages/db/supabase/deploy-v0.2.8-enterprise-auth.sql",
);

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

function readAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const candidates = [
    resolve(homedir(), ".supabase/access-token"),
    resolve(homedir(), "Library/Application Support/supabase/access-token"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return readFileSync(path, "utf8").trim();
  }
  return null;
}

loadEnvFile(envPath);

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
  /\/+$/,
  "",
);
const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const token = readAccessToken();

if (!projectRef) {
  console.error("Could not parse Supabase project ref");
  process.exit(1);
}

if (!token) {
  console.error("No Supabase access token — run npx supabase login");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`Migration failed (${res.status}):`, text);
  process.exit(1);
}

console.log("OK: deploy-v0.2.8-enterprise-auth.sql applied");
if (text.trim()) console.log(text);

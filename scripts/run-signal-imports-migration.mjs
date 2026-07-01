#!/usr/bin/env node
/**
 * Apply deploy-v0.2.6-signal-imports.sql to Supabase.
 * Requires DATABASE_URL or SUPABASE_DB_URL in apps/agency/.env.local
 * (Supabase → Settings → Database → Connection string → URI)
 */
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

const dbUrl =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error(
    "Missing DATABASE_URL. Add to apps/agency/.env.local:\n" +
      "DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  );
  process.exit(1);
}

const sqlPath = resolve(
  root,
  "packages/db/supabase/deploy-v0.2.6-signal-imports.sql",
);
const sql = readFileSync(sqlPath, "utf8");

const { default: postgres } = await import("postgres");
const sqlClient = postgres(dbUrl, { max: 1, ssl: "require" });

try {
  await sqlClient.unsafe(sql);
  console.log("OK: signal_imports migration applied");
} finally {
  await sqlClient.end({ timeout: 5 });
}

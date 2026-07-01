#!/usr/bin/env node
/**
 * Apply pipeline_artifacts migration via Supabase Management API or direct Postgres.
 * Run: node scripts/apply-pipeline-migration.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");
const sqlPath = resolve(
  root,
  "packages/db/supabase/deploy-v0.3.0-pipeline.sql",
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
  for (const path of [
    resolve(homedir(), ".supabase/access-token"),
    resolve(homedir(), "Library/Application Support/supabase/access-token"),
  ]) {
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
const sql = readFileSync(sqlPath, "utf8");

async function viaManagementApi(token) {
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
  if (!res.ok) throw new Error(`Management API (${res.status}): ${text}`);
  return text;
}

async function viaPostgres() {
  const dbUrl =
    process.env.DATABASE_URL?.trim() ??
    process.env.SUPABASE_DB_URL?.trim() ??
    process.env.POSTGRES_URL?.trim();
  if (!dbUrl) return false;

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    return true;
  } finally {
    await client.end();
  }
}

async function verifyTable(serviceKey) {
  const res = await fetch(
    `${url}/rest/v1/pipeline_artifacts?select=id&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  return res.status !== 404 && !((await res.text()).includes("pipeline_artifacts"));
}

if (!projectRef) {
  console.error("Missing Supabase URL");
  process.exit(1);
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey && (await verifyTable(serviceKey))) {
  console.log("OK: pipeline_artifacts already exists");
  process.exit(0);
}

const token = readAccessToken();
if (token) {
  try {
    await viaManagementApi(token);
    console.log("OK: migration applied via Supabase Management API");
    process.exit(0);
  } catch (err) {
    console.warn("Management API failed:", err.message);
  }
}

try {
  if (await viaPostgres()) {
    console.log("OK: migration applied via Postgres");
    process.exit(0);
  }
} catch (err) {
  console.warn("Postgres failed:", err.message);
}

console.error(`
Could not apply migration automatically.

Paste this file into Supabase SQL Editor and click Run:
  ${sqlPath}

Then re-run automation at /automation
`);
process.exit(1);

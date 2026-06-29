#!/usr/bin/env node
/**
 * Apply release SQL migrations in order via DATABASE_URL or Supabase Management API.
 * Usage: node scripts/apply-release-migrations.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, "apps/agency/.env.local");

const SQL_FILES = [
  "packages/db/supabase/deploy-v0.2.7-scout.sql",
  "packages/db/supabase/deploy-v0.2.8-enterprise-auth.sql",
  "packages/db/supabase/deploy-v0.2.9-opportunity-watch.sql",
];

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

const dbUrl =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL;

async function applyViaPostgres(sql, label) {
  const { default: postgres } = await import("postgres");
  const sqlClient = postgres(dbUrl, { max: 1, ssl: "require" });
  try {
    await sqlClient.unsafe(sql);
    console.log(`OK: ${label} (postgres)`);
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

async function applyViaManagementApi(sql, label, projectRef, token) {
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
    throw new Error(`${label} failed (${res.status}): ${text}`);
  }
  console.log(`OK: ${label} (management API)`);
}

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
  /\/+$/,
  "",
);
const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const token = readAccessToken();

for (const rel of SQL_FILES) {
  const sqlPath = resolve(root, rel);
  const sql = readFileSync(sqlPath, "utf8");
  const label = rel.split("/").pop();

  if (dbUrl) {
    await applyViaPostgres(sql, label);
  } else if (projectRef && token) {
    await applyViaManagementApi(sql, label, projectRef, token);
  } else {
    console.error(
      "Need DATABASE_URL in .env.local or Supabase access token (npx supabase login)",
    );
    process.exit(1);
  }
}

console.log("All release migrations applied.");

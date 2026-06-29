#!/usr/bin/env node
/**
 * Deploy Impact to Vercel Production from local source (latest commit on disk).
 *
 * Usage:
 *   npm run deploy
 *   node scripts/deploy-production.mjs
 *
 * Requires: `vercel login` once (or VERCEL_TOKEN in env).
 * Project is linked via .vercel/project.json → getforge/impact
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prodUrl = "https://impact.weareninetytwo.xyz";

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function sh(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
}

console.log("=== Impact production deploy ===\n");

const sha = sh("git rev-parse --short HEAD");
const msg = sh("git log -1 --format=%s");
console.log(`Commit: ${sha} — ${msg}\n`);

console.log("Deploying to Vercel Production…");
run("npx vercel deploy --prod --yes");

console.log("\nVerifying login route…");
const html = sh(`curl -s "${prodUrl}/login"`);
if (html.includes('action="/api/auth/login"')) {
  console.log("OK: /login uses /api/auth/login");
} else {
  console.warn("WARN: login form may still be old — check Vercel alias / cache");
}

console.log(`\nDone. Open ${prodUrl}/login`);

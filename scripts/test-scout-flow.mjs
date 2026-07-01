/**
 * End-to-end Scout smoke test (uses @impact/db directly, same as server actions).
 * Run from repo root: node scripts/test-scout-flow.mjs
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
process.chdir(resolve(root, "apps/agency"));

const {
  addScoutPresets,
  listScoutSources,
  updateScoutSource,
  runScoutSource,
  listScoutRuns,
  listPendingSignalImports,
  skipSignalImport,
} = await import("@impact/db");

console.log("1. Add presets…");
const created = await addScoutPresets();
console.log(`   Created ${created.length} preset(s)`);

const sources = await listScoutSources();
const googleNews = sources.find((s) =>
  s.name.toLowerCase().includes("google news"),
);
if (!googleNews) {
  console.error("Google News preset not found");
  process.exit(1);
}

console.log(`2. Enable: ${googleNews.name}`);
await updateScoutSource(googleNews.id, { enabled: true });

console.log("3. Run Scout…");
const run = await runScoutSource(googleNews.id);
console.log(
  `   status=${run.status} found=${run.found_count} queued=${run.queued_count} skipped=${run.skipped_count}`,
);
if (run.error) console.log(`   error: ${run.error}`);

const pending = await listPendingSignalImports();
const scoutPending = pending.filter((p) => p.import_source === "scraper");
console.log(`4. Pending scout imports: ${scoutPending.length}`);

if (scoutPending.length > 0) {
  const sample = scoutPending[0];
  console.log(`   Sample: ${sample.company_name} — ${sample.opportunity_title}`);
  console.log("5. Skip sample (smoke test cleanup)…");
  await skipSignalImport(sample.id);
  console.log("   Skipped OK");
}

const runs = await listScoutRuns(5);
console.log(`6. Recent runs: ${runs.length}`);
for (const r of runs.slice(0, 3)) {
  console.log(
    `   ${r.status} found=${r.found_count} queued=${r.queued_count} @ ${r.started_at}`,
  );
}

console.log("\nOK: Scout flow verified");

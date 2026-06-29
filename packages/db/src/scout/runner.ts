import type { ScoutRun, ScoutRunSummary, ScoutSource } from "@impact/shared";
import { importSignalItems } from "../signals/ingest";
import { listPendingSignalImports } from "../signals/import-repository";
import { fetchHtmlItems } from "./fetch-html";
import { fetchRssItems, type RawScoutItem } from "./fetch-rss";
import {
  buildGoogleNewsRssUrl,
  normalizeScoutItems,
} from "./normalize";
import {
  createScoutRunRecord,
  finishScoutRun,
  getScoutSource,
  listEnabledScoutSources,
  touchScoutSourceAfterRun,
} from "./repository";

async function collectRawItems(source: ScoutSource): Promise<RawScoutItem[]> {
  switch (source.source_type) {
    case "rss": {
      if (!source.url) {
        throw new Error("RSS source requires a feed URL");
      }
      return fetchRssItems(source.url);
    }
    case "html": {
      if (!source.url) {
        throw new Error("HTML source requires a page URL");
      }
      return fetchHtmlItems(source.url);
    }
    case "manual_query": {
      if (!source.query?.trim()) {
        throw new Error("Manual query source requires search terms in query");
      }
      const feedUrl = buildGoogleNewsRssUrl(source.query);
      return fetchRssItems(feedUrl);
    }
    case "stub":
      throw new Error(
        `${source.name} is a placeholder source — wire API/export ingest in a later epic`,
      );
    default:
      throw new Error(`Unsupported source type: ${source.source_type}`);
  }
}

async function filterDuplicateUrls(
  items: ReturnType<typeof normalizeScoutItems>,
): Promise<{
  toQueue: ReturnType<typeof normalizeScoutItems>;
  skipped: number;
}> {
  const pending = await listPendingSignalImports();
  const seenUrls = new Set(
    pending
      .map((p) => p.source_url?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );

  const toQueue = [];
  let skipped = 0;

  for (const item of items) {
    const url = item.source_url?.trim().toLowerCase();
    if (url && seenUrls.has(url)) {
      skipped++;
      continue;
    }
    if (url) seenUrls.add(url);
    toQueue.push(item);
  }

  return { toQueue, skipped };
}

function resolveRunStatus(
  queued: number,
  skipped: number,
  found: number,
  errors: string[],
): ScoutRun["status"] {
  if (errors.length > 0 && queued === 0) return "failed";
  if (errors.length > 0 || (skipped > 0 && queued > 0)) return "partial";
  if (found === 0) return "success";
  return "success";
}

export async function runScoutSource(sourceId: string): Promise<ScoutRun> {
  const source = await getScoutSource(sourceId);
  if (!source) throw new Error("Scout source not found");
  if (!source.enabled) throw new Error("Scout source is disabled");

  const run = await createScoutRunRecord(sourceId);
  const errors: string[] = [];

  try {
    const rawItems = await collectRawItems(source);
    const normalized = normalizeScoutItems(rawItems, source);
    const { toQueue, skipped: dedupeSkipped } =
      await filterDuplicateUrls(normalized);

    let queued = 0;
    let skipped = dedupeSkipped;

    if (toQueue.length > 0) {
      const importResult = await importSignalItems(
        { items: toQueue, mode: "review", import_source: "scraper" },
        { mode: "review", importSource: "scraper" },
      );
      queued = importResult.queued;
      skipped += importResult.skipped;
      errors.push(...importResult.errors);
    }

    const status = resolveRunStatus(
      queued,
      skipped,
      normalized.length,
      errors,
    );

    const finished = await finishScoutRun(run.id, {
      status,
      found_count: normalized.length,
      queued_count: queued,
      skipped_count: skipped,
      error: errors.length > 0 ? errors.join("; ") : null,
    });

    await touchScoutSourceAfterRun(sourceId, {
      success: status !== "failed",
      error: finished.error,
    });

    return finished;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scout run failed";
    const finished = await finishScoutRun(run.id, {
      status: "failed",
      error: message,
    });
    await touchScoutSourceAfterRun(sourceId, {
      success: false,
      error: message,
    });
    return finished;
  }
}

export async function runAllEnabledScoutSources(): Promise<ScoutRunSummary> {
  const sources = await listEnabledScoutSources();
  const runs: ScoutRun[] = [];
  const errors: string[] = [];
  let totalFound = 0;
  let totalQueued = 0;
  let totalSkipped = 0;

  for (const source of sources) {
    try {
      const run = await runScoutSource(source.id);
      runs.push(run);
      totalFound += run.found_count;
      totalQueued += run.queued_count;
      totalSkipped += run.skipped_count;
      if (run.error) errors.push(`${source.name}: ${run.error}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${source.name}: ${message}`);
    }
  }

  return {
    sources_run: sources.length,
    runs,
    total_found: totalFound,
    total_queued: totalQueued,
    total_skipped: totalSkipped,
    errors,
  };
}

export async function runScout(
  sourceId?: string,
): Promise<ScoutRun | ScoutRunSummary> {
  if (sourceId) {
    return runScoutSource(sourceId);
  }
  return runAllEnabledScoutSources();
}

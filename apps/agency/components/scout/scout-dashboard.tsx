"use client";

import { useState, useTransition } from "react";
import type { ScoutRun, ScoutSource } from "@impact/shared";
import {
  addScoutPresetsAction,
  createScoutSourceAction,
  toggleScoutSourceAction,
} from "@/lib/scout/actions";
import { ScoutSourceRow, RunScoutButton } from "./scout-panels";
import styles from "./scout-panels.module.css";

interface ScoutSourcesPanelProps {
  sources: ScoutSource[];
}

export function ScoutSourcesPanel({ sources }: ScoutSourcesPanelProps) {
  const [items, setItems] = useState(sources);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, enabled: boolean) {
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
    );
    startTransition(async () => {
      const result = await toggleScoutSourceAction(id, enabled);
      if ("error" in result) setStatus(result.error);
    });
  }

  function handleAddPresets() {
    setStatus(null);
    startTransition(async () => {
      const result = await addScoutPresetsAction();
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      setStatus(`Added ${result.created} preset source(s). Refresh to see them.`);
      window.location.reload();
    });
  }

  function handleCreate(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const result = await createScoutSourceAction({
        name: String(formData.get("name") ?? ""),
        source_type: String(formData.get("source_type") ?? "rss") as ScoutSource["source_type"],
        url: String(formData.get("url") ?? "") || null,
        query: String(formData.get("query") ?? "") || null,
        enabled: true,
      });
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Scout sources</h2>
        <div className={styles.sectionActions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={handleAddPresets}
            disabled={isPending}
          >
            Add presets
          </button>
          <RunScoutButton label="Run Scout" />
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          No scout sources yet. Add presets or create a custom source below.
        </p>
      ) : (
        <div className={styles.sourceList}>
          {items.map((source) => (
            <ScoutSourceRow
              key={source.id}
              source={source}
              onToggle={handleToggle}
              toggling={isPending}
            />
          ))}
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate(new FormData(e.currentTarget));
        }}
      >
        <h3 className={styles.formTitle}>Add custom source</h3>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            Name
            <input name="name" required placeholder="My RSS feed" />
          </label>
          <label className={styles.field}>
            Type
            <select name="source_type" defaultValue="rss">
              <option value="rss">RSS</option>
              <option value="html">HTML (basic)</option>
              <option value="manual_query">Manual query (Google News RSS)</option>
              <option value="stub">Stub / placeholder</option>
            </select>
          </label>
          <label className={styles.field}>
            URL
            <input name="url" placeholder="https://..." />
          </label>
          <label className={styles.field}>
            Query
            <input name="query" placeholder="Search terms for manual_query" />
          </label>
        </div>
        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={isPending}
        >
          Create source
        </button>
      </form>

      {status ? <p className={styles.status}>{status}</p> : null}
    </section>
  );
}

interface ScoutRunsPanelProps {
  runs: ScoutRun[];
  sources: ScoutSource[];
}

export function ScoutRunsPanel({ runs, sources }: ScoutRunsPanelProps) {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Run history</h2>
      {runs.length === 0 ? (
        <p className={styles.empty}>No scout runs yet.</p>
      ) : (
        <div className={styles.runList}>
          {runs.map((run) => (
            <article key={run.id} className={styles.runCard}>
              <div className={styles.runHeader}>
                <strong>{sourceNames.get(run.source_id) ?? "Unknown source"}</strong>
                <span className={styles[`status_${run.status}`] ?? styles.statusDefault}>
                  {run.status}
                </span>
              </div>
              <p className={styles.runStats}>
                Found {run.found_count} · Queued {run.queued_count} · Skipped{" "}
                {run.skipped_count}
              </p>
              <p className={styles.runWhen}>
                {formatWhen(run.started_at)}
                {run.finished_at ? ` → ${formatWhen(run.finished_at)}` : ""}
              </p>
              {run.error ? (
                <p className={styles.errorText}>{run.error}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

"use client";

import { useState, useTransition } from "react";
import type { ScoutSource } from "@impact/shared";
import { runScoutAction } from "@/lib/scout/actions";
import styles from "./scout-panels.module.css";

interface RunScoutButtonProps {
  sourceId?: string;
  label?: string;
  variant?: "primary" | "secondary";
}

export function RunScoutButton({
  sourceId,
  label,
  variant = "primary",
}: RunScoutButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setMessage(null);
    startTransition(async () => {
      const result = await runScoutAction(sourceId);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }

      const data = result.result;
      if ("sources_run" in data) {
        setMessage(
          `Ran ${data.sources_run} source(s): ${data.total_queued} queued, ${data.total_skipped} skipped`,
        );
      } else {
        setMessage(
          `Found ${data.found_count}, queued ${data.queued_count}, skipped ${data.skipped_count}`,
        );
      }
    });
  }

  const buttonLabel =
    label ?? (sourceId ? "Run source" : "Run all enabled sources");

  return (
    <div className={styles.runWrap}>
      <button
        type="button"
        className={
          variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary
        }
        onClick={handleRun}
        disabled={isPending}
      >
        {isPending ? "Running…" : buttonLabel}
      </button>
      {message ? <p className={styles.runMessage}>{message}</p> : null}
    </div>
  );
}

interface ScoutSourceRowProps {
  source: ScoutSource;
  onToggle: (id: string, enabled: boolean) => void;
  toggling?: boolean;
}

export function ScoutSourceRow({
  source,
  onToggle,
  toggling,
}: ScoutSourceRowProps) {
  return (
    <article className={styles.sourceCard}>
      <div className={styles.sourceHeader}>
        <div>
          <h3 className={styles.sourceName}>{source.name}</h3>
          <p className={styles.sourceMeta}>
            {source.source_type}
            {source.url ? ` · ${source.url}` : ""}
          </p>
          {source.query ? (
            <p className={styles.sourceQuery}>Query: {source.query}</p>
          ) : null}
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={source.enabled}
            disabled={toggling}
            onChange={(e) => onToggle(source.id, e.target.checked)}
          />
          Enabled
        </label>
      </div>

      <div className={styles.sourceFooter}>
        <RunScoutButton sourceId={source.id} variant="secondary" />
        <div className={styles.timestamps}>
          {source.last_run_at ? (
            <span>Last run: {formatWhen(source.last_run_at)}</span>
          ) : (
            <span>Never run</span>
          )}
          {source.last_error ? (
            <span className={styles.errorText}>{source.last_error}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

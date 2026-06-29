"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type {
  OpportunityWatchRun,
  ScoutSource,
  SignalImport,
} from "@impact/shared";
import { runOpportunityWatchAction } from "@/lib/opportunity-watch/actions";
import styles from "./opportunity-watch-panel.module.css";

interface OpportunityWatchPanelProps {
  latestRun: OpportunityWatchRun | null;
  runs: OpportunityWatchRun[];
  sources: ScoutSource[];
  pending: SignalImport[];
  recent: SignalImport[];
}

export function OpportunityWatchPanel({
  latestRun,
  runs,
  sources,
  pending,
  recent,
}: OpportunityWatchPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const enabledSources = sources.filter((s) => s.enabled);

  function handleRun() {
    setMessage(null);
    startTransition(async () => {
      const result = await runOpportunityWatchAction();
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `Queued ${result.queued} signal(s) — found ${result.found}, skipped ${result.skipped}`,
      );
      window.location.reload();
    });
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>Run Opportunity Watch</h2>
          <p className={styles.heroBody}>
            Fetches enabled Scout sources and queues new leads into the review
            pipeline — no direct pipeline bypass.
          </p>
        </div>
        <button
          type="button"
          className={styles.runBtn}
          onClick={handleRun}
          disabled={isPending}
        >
          {isPending ? "Running…" : "Run Opportunity Watch"}
        </button>
      </section>

      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Last run</h3>
          {latestRun ? (
            <>
              <p className={styles.statLine}>
                <span className={styles[`status_${latestRun.status}`]}>
                  {latestRun.status}
                </span>
                · {formatWhen(latestRun.started_at)}
              </p>
              <p className={styles.meta}>
                Sources {latestRun.sources_run} · Found {latestRun.found_count}{" "}
                · Queued {latestRun.queued_count} · Skipped{" "}
                {latestRun.skipped_count}
              </p>
              {latestRun.error ? (
                <p className={styles.error}>{latestRun.error}</p>
              ) : null}
            </>
          ) : (
            <p className={styles.muted}>No runs yet.</p>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Pending review</h3>
          <p className={styles.bigNumber}>{pending.length}</p>
          <Link href="/signals/review" className={styles.link}>
            Open review queue →
          </Link>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Enabled sources</h3>
          <p className={styles.bigNumber}>{enabledSources.length}</p>
          <Link href="/signals/scout" className={styles.link}>
            Manage Scout sources →
          </Link>
        </section>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Source status</h3>
        {sources.length === 0 ? (
          <p className={styles.muted}>
            No sources configured.{" "}
            <Link href="/signals/scout">Add Scout presets</Link> first.
          </p>
        ) : (
          <ul className={styles.sourceList}>
            {sources.map((source) => (
              <li key={source.id} className={styles.sourceItem}>
                <div>
                  <strong>{source.name}</strong>
                  <span className={styles.sourceType}>{source.source_type}</span>
                </div>
                <span
                  className={
                    source.enabled ? styles.enabled : styles.disabled
                  }
                >
                  {source.enabled ? "Enabled" : "Off"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Run history</h3>
        {runs.length === 0 ? (
          <p className={styles.muted}>No run history.</p>
        ) : (
          <ul className={styles.runList}>
            {runs.map((run) => (
              <li key={run.id} className={styles.runItem}>
                <span className={styles[`status_${run.status}`]}>
                  {run.status}
                </span>
                <span>{formatWhen(run.started_at)}</span>
                <span>
                  queued {run.queued_count} / found {run.found_count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent imports</h3>
        {recent.length === 0 ? (
          <p className={styles.muted}>No imports yet.</p>
        ) : (
          <ul className={styles.importList}>
            {recent.map((item) => (
              <li key={item.id} className={styles.importItem}>
                <strong>{item.company_name}</strong>
                <span>{item.opportunity_title}</span>
                <span className={styles.importMeta}>
                  {item.status} · {item.import_source}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

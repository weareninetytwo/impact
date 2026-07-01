"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity, SignalImport } from "@impact/shared";
import { stripHtml } from "@impact/shared";
import {
  approveSignalImportAction,
  mergeSignalImportAction,
  skipSignalImportAction,
} from "@/lib/signals/actions";
import styles from "./signal-review-card.module.css";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SignalReviewCard({
  record,
  opportunities,
}: {
  record: SignalImport;
  opportunities: Opportunity[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");

  async function runAction(
    action: () => Promise<{ ok: true } | { error: string }>,
  ) {
    setPending(true);
    setError(null);
    const result = await action();
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
    setMergeOpen(false);
  }

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div>
          <p className={styles.company}>{stripHtml(record.company_name)}</p>
          <h2 className={styles.title}>{stripHtml(record.opportunity_title)}</h2>
        </div>
        <div className={styles.meta}>
          {record.fit_score != null && (
            <span className={styles.score}>{record.fit_score} fit</span>
          )}
          <span className={styles.badge}>{record.import_source}</span>
        </div>
      </div>

      {record.signal_summary && (
        <p className={styles.summary}>{stripHtml(record.signal_summary)}</p>
      )}

      <dl className={styles.details}>
        <div>
          <dt>Signal</dt>
          <dd>{record.signal_type}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{record.source_name ?? "—"}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{record.deadline ?? "—"}</dd>
        </div>
        <div>
          <dt>Est. value</dt>
          <dd>{formatCurrency(record.estimated_value)}</dd>
        </div>
        {record.location && (
          <div>
            <dt>Location</dt>
            <dd>{record.location}</dd>
          </div>
        )}
      </dl>

      {record.fit_notes && (
        <p className={styles.notes}>
          <strong>Fit:</strong> {record.fit_notes}
        </p>
      )}

      {record.recommended_action && (
        <p className={styles.action}>
          <strong>Recommended:</strong> {record.recommended_action}
        </p>
      )}

      {record.source_url && (
        <a
          href={record.source_url}
          className={styles.link}
          target="_blank"
          rel="noreferrer"
        >
          View source
        </a>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {mergeOpen ? (
        <div className={styles.mergeBox}>
          <select
            className={styles.select}
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
          >
            <option value="">Select opportunity…</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.company_name} — {opp.title}
              </option>
            ))}
          </select>
          <div className={styles.mergeActions}>
            <button
              type="button"
              className={styles.mergeConfirm}
              disabled={pending || !mergeTarget}
              onClick={() =>
                runAction(() =>
                  mergeSignalImportAction(record.id, mergeTarget),
                )
              }
            >
              Confirm merge
            </button>
            <button
              type="button"
              className={styles.mergeCancel}
              disabled={pending}
              onClick={() => setMergeOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.approve}
            disabled={pending}
            onClick={() =>
              runAction(() => approveSignalImportAction(record.id))
            }
          >
            Approve
          </button>
          <button
            type="button"
            className={styles.merge}
            disabled={pending}
            onClick={() => setMergeOpen(true)}
          >
            Merge
          </button>
          <button
            type="button"
            className={styles.skip}
            disabled={pending}
            onClick={() => runAction(() => skipSignalImportAction(record.id))}
          >
            Skip
          </button>
        </div>
      )}
    </article>
  );
}

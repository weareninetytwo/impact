"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { prepareAllOutreachAction, refreshAllOutreachDraftsAction } from "@/lib/outreach/actions";
import styles from "./outreach-toolbar.module.css";

export function OutreachToolbar({ queueCount }: { queueCount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePrepareAll() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await prepareAllOutreachAction();
    if ("error" in result) {
      setError(result.error);
    } else {
      setMessage(
        `Prepared ${result.count} A/B lead${result.count === 1 ? "" : "s"} with drafts and marked ready for outreach.`,
      );
      router.refresh();
    }
    setPending(false);
  }

  async function handleRefreshDrafts() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await refreshAllOutreachDraftsAction();
    if ("error" in result) {
      setError(result.error);
    } else {
      setMessage(
        `Refreshed ${result.count} A/B draft${result.count === 1 ? "" : "s"} — review and save any edits.`,
      );
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className={styles.toolbar}>
      <p className={styles.hint}>
        {queueCount} lead{queueCount === 1 ? "" : "s"} in your send queue (A/B/C
        grades). Edit drafts tonight, open Gmail tomorrow, hit send.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={pending || queueCount === 0}
          onClick={handlePrepareAll}
        >
          {pending ? "Preparing…" : "Prepare all A/B drafts"}
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={pending || queueCount === 0}
          onClick={handleRefreshDrafts}
        >
          {pending ? "Refreshing…" : "Refresh A/B drafts"}
        </button>
      </div>
      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

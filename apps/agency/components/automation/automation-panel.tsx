"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runAutomationAction } from "@/lib/pipeline/actions";
import styles from "./automation-panel.module.css";

export function AutomationPanel({
  lastRunAt,
}: {
  lastRunAt: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await runAutomationAction();
    if ("error" in result) {
      setError(result.error);
    } else {
      setMessage(
        `Processed ${result.summary.opportunities_processed} opportunities · ${result.summary.proposals_generated} proposals · ${result.summary.outreach_drafts_prepared} drafts prepared.`,
      );
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className={styles.panel}>
      <p className={styles.lead}>
        Runs the full agent chain: Scout → triage imports → research →
        qualification → closer briefs → nurture → outreach drafts → proposals →
        tasks.
      </p>
      {lastRunAt && (
        <p className={styles.meta}>Last run: {new Date(lastRunAt).toLocaleString()}</p>
      )}
      <button
        type="button"
        className={styles.button}
        disabled={pending}
        onClick={handleRun}
      >
        {pending ? "Running pipeline…" : "Run full automation now"}
      </button>
      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

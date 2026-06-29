"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { skipAllPendingSignalImportsAction } from "@/lib/signals/actions";
import styles from "./bulk-skip-bar.module.css";

export function BulkSkipBar({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pendingCount === 0) return null;

  async function handleSkipAll() {
    if (
      !window.confirm(
        `Skip all ${pendingCount} pending imports? This cannot be undone.`,
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    const result = await skipAllPendingSignalImportsAction();
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
  }

  return (
    <div className={styles.bar}>
      <p>
        <strong>{pendingCount}</strong> pending import
        {pendingCount === 1 ? "" : "s"} — skip junk Scout noise in one click.
      </p>
      <button
        type="button"
        className={styles.button}
        disabled={pending}
        onClick={handleSkipAll}
      >
        {pending ? "Skipping…" : "Skip all pending"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

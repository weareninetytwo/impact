import Link from "next/link";
import { fetchPendingSignalImports } from "@/lib/signals/actions";
import { fetchOpportunities } from "@/lib/opportunities/actions";
import { SignalReviewCard } from "@/components/signals/signal-review-card";
import styles from "./page.module.css";

export default async function SignalReviewPage() {
  const [pending, opportunities] = await Promise.all([
    fetchPendingSignalImports(),
    fetchOpportunities(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Import review</h1>
          <p className={styles.subtitle}>
            Approve, merge, or skip imported signals before they hit the live
            pipeline.
          </p>
        </div>
        <Link href="/signals" className={styles.backLink}>
          ← Signals
        </Link>
      </header>

      {pending.length === 0 ? (
        <div className={styles.empty}>
          <p>No pending imports.</p>
          <p className={styles.emptyHint}>
            GPT and API imports land here by default. Use{" "}
            <Link href="/signals/import-test">Import test</Link> with direct
            mode for immediate pipeline testing.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {pending.map((record) => (
            <SignalReviewCard
              key={record.id}
              record={record}
              opportunities={opportunities}
            />
          ))}
        </div>
      )}
    </div>
  );
}

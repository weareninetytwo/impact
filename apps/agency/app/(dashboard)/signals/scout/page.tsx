import Link from "next/link";
import { ScoutRunsPanel, ScoutSourcesPanel } from "@/components/scout/scout-dashboard";
import { fetchScoutRuns, fetchScoutSources } from "@/lib/scout/actions";
import styles from "./page.module.css";

export default async function ScoutPage() {
  const [sources, runs] = await Promise.all([
    fetchScoutSources(),
    fetchScoutRuns(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Scheduled Scout</h1>
          <p className={styles.subtitle}>
            Autonomous source monitors that queue high-fit signals into the
            import review pipeline — nothing enters live opportunities until
            you approve.
          </p>
        </div>
        <Link href="/signals" className={styles.backLink}>
          ← Signals
        </Link>
      </header>

      <ScoutSourcesPanel sources={sources} />
      <ScoutRunsPanel runs={runs} sources={sources} />

      <section className={styles.note}>
        <p>
          Scout uses the same ingest path as GPT imports:{" "}
          <code>importSignalItems</code> with <code>mode: review</code> and{" "}
          <code>import_source: scraper</code>. Queued items appear on{" "}
          <Link href="/signals/review">Import review</Link>.
        </p>
      </section>
    </div>
  );
}

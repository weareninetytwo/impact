import Link from "next/link";
import styles from "./page.module.css";

export default function SignalsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Signals</h1>
        <p className={styles.subtitle}>
          Ingest opportunity-watch results from ChatGPT, Custom GPT Actions, or
          automation tools.
        </p>
      </header>

      <div className={styles.cards}>
        <Link href="/signals/review" className={styles.card}>
          <h2 className={styles.cardTitle}>Review queue</h2>
          <p className={styles.cardBody}>
            Approve, merge, or skip GPT and API imports before they enter the
            live opportunity pipeline.
          </p>
        </Link>

        <Link href="/signals/import-test" className={styles.card}>
          <h2 className={styles.cardTitle}>Import test</h2>
          <p className={styles.cardBody}>
            Paste JSON payloads manually — fastest way to test the full loop
            before wiring Custom GPT Actions.
          </p>
        </Link>

        <div className={styles.cardMuted}>
          <h2 className={styles.cardTitle}>API ingest</h2>
          <p className={styles.cardBody}>
            <code>POST /api/signals/import</code> with Bearer{" "}
            <code>IMPACT_INGEST_SECRET</code>. See{" "}
            <code>docs/epic3a-chatgpt-ingest.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

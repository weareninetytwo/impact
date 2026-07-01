import Link from "next/link";
import {
  fetchAutomationSummary,
  fetchLatestAutomationRun,
} from "@/lib/pipeline/actions";
import { AutomationPanel } from "@/components/automation/automation-panel";
import styles from "@/components/automation/automation-panel.module.css";
import pageStyles from "@/components/pipeline/pipeline-page.module.css";

export default async function AutomationPage() {
  const [lastRun, summary] = await Promise.all([
    fetchLatestAutomationRun(),
    fetchAutomationSummary(),
  ]);

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Automation</h1>
        <p className={pageStyles.subtitle}>
          Stage 9 — full agent chain. Run overnight or on-demand; humans
          intervene at send/close only.
        </p>
      </header>

      <AutomationPanel lastRunAt={lastRun?.created_at ?? null} />

      {summary ? (
        <section className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>Latest executive briefing</h2>
          <p className={pageStyles.meta}>
            {new Date(summary.finished_at).toLocaleString()} ·{" "}
            {summary.opportunities_processed} opps processed
          </p>
          <div className={styles.briefing}>{summary.briefing}</div>
          <div className={pageStyles.actions}>
            <Link href="/outreach" className={pageStyles.btn}>
              Open outreach queue
            </Link>
            <Link href="/proposals" className={pageStyles.btn}>
              View proposals
            </Link>
            <Link href="/tasks" className={pageStyles.btn}>
              View tasks
            </Link>
          </div>
        </section>
      ) : (
        <div className={pageStyles.empty}>
          <p>No automation run yet. Click &quot;Run full automation now&quot; to process your pipeline.</p>
        </div>
      )}
    </div>
  );
}

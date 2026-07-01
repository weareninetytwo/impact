import Link from "next/link";
import { fetchOpportunities, fetchDashboardStats } from "@/lib/opportunities/actions";
import { fetchAutomationSummary } from "@/lib/pipeline/actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function AnalyticsPage() {
  const [stats, opportunities, automation] = await Promise.all([
    fetchDashboardStats(),
    fetchOpportunities(),
    fetchAutomationSummary(),
  ]);

  const byGrade = { A: 0, B: 0, C: 0, D: 0 };
  const byStage: Record<string, number> = {};
  for (const opp of opportunities) {
    byGrade[opp.lead_grade]++;
    byStage[opp.stage] = (byStage[opp.stage] ?? 0) + 1;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>
          Funnel health, grade distribution, and automation throughput.
        </p>
      </header>

      <div className={styles.list}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Pipeline</h2>
          <p className={styles.body}>
            Open opportunities: {stats.total} · A-grade: {stats.a_grade} · Ready
            for outreach: {stats.ready_for_outreach} · Est. value: $
            {stats.pipeline_value.toLocaleString()}
          </p>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Grade distribution</h2>
          <p className={styles.body}>
            A: {byGrade.A} · B: {byGrade.B} · C: {byGrade.C} · D: {byGrade.D}
          </p>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Stage breakdown</h2>
          <p className={styles.body}>
            {Object.entries(byStage)
              .map(([stage, count]) => `${stage.replace(/_/g, " ")}: ${count}`)
              .join(" · ")}
          </p>
        </article>

        {automation && (
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Last automation run</h2>
            <p className={styles.body}>
              Processed {automation.opportunities_processed} · Research{" "}
              {automation.research_generated} · Proposals{" "}
              {automation.proposals_generated} · Tasks {automation.tasks_created}
            </p>
          </article>
        )}
      </div>

      <div className={styles.actions} style={{ marginTop: "1rem" }}>
        <Link href="/automation" className={styles.btn}>
          Run automation
        </Link>
      </div>
    </div>
  );
}

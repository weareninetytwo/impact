import Link from "next/link";
import { fetchDashboardStats, fetchOpportunities } from "@/lib/opportunities/actions";
import { fetchPendingImportCount } from "@/lib/signals/actions";
import { fetchLatestOpportunityWatchRun } from "@/lib/opportunity-watch/actions";
import { GradeBadge } from "@/components/opportunities/grade-badge";
import { DashboardRefreshBar } from "@/components/dashboard/dashboard-refresh-bar";
import styles from "./page.module.css";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const dataAsOf = new Date().toISOString();
  const [stats, opportunities, pendingReview, lastWatch] = await Promise.all([
    fetchDashboardStats(),
    fetchOpportunities(),
    fetchPendingImportCount(),
    fetchLatestOpportunityWatchRun(),
  ]);

  const aGrade = opportunities.filter((o) => o.lead_grade === "A");
  const newOpps = opportunities.filter((o) => o.stage === "new");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Sales command center — what needs action today
        </p>
      </header>

      <DashboardRefreshBar dataAsOf={dataAsOf} />

      <div className={styles.stats}>
        <Link href="/signals/review" className={styles.statLink}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{pendingReview}</span>
            <span className={styles.statLabel}>Pending review</span>
          </div>
        </Link>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.new_count}</span>
          <span className={styles.statLabel}>New opportunities</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.needs_contact}</span>
          <span className={styles.statLabel}>Contact needed</span>
        </div>
        <Link href="/outreach" className={styles.statLink}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.ready_for_outreach}</span>
            <span className={styles.statLabel}>Ready for outreach</span>
          </div>
        </Link>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.nurturing_count}</span>
          <span className={styles.statLabel}>Nurturing</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.in_proposal}</span>
          <span className={styles.statLabel}>In proposal</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.a_grade}</span>
          <span className={styles.statLabel}>A-grade (open)</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatCurrency(stats.open_estimated_pipeline)}
          </span>
          <span className={styles.statLabel}>Open estimated pipeline</span>
        </div>
      </div>

      {lastWatch && (
        <section className={styles.lastRun}>
          <h2 className={styles.lastRunTitle}>Last Opportunity Watch run</h2>
          <p className={styles.lastRunBody}>
            Queued by Last Watch: <strong>{lastWatch.queued_count}</strong>
            {" · "}
            Run at {formatWhen(lastWatch.started_at)}
          </p>
          <Link
            href="/signals/opportunity-watch"
            className={styles.lastRunLink}
          >
            View Opportunity Watch →
          </Link>
        </section>
      )}

      <div className={styles.quick}>
        <Link href="/opportunities/new" className={styles.quickBtn}>
          + New opportunity
        </Link>
        <Link href="/opportunities/import" className={styles.quickBtnSecondary}>
          Import CSV / paste
        </Link>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>A-grade — book qualified calls</h2>
        {aGrade.length === 0 ? (
          <p className={styles.empty}>No A-grade opportunities yet.</p>
        ) : (
          <ul className={styles.list}>
            {aGrade.slice(0, 5).map((opp) => (
              <li key={opp.id}>
                <Link href={`/opportunities/${opp.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <GradeBadge grade={opp.lead_grade} />
                    <span className={styles.score}>
                      {opp.total_score.toFixed(1)}
                    </span>
                  </div>
                  <strong>{opp.title}</strong>
                  <span className={styles.company}>{opp.company_name}</span>
                  <span className={styles.nextAction}>{opp.next_action}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>New — needs review</h2>
        {newOpps.length === 0 ? (
          <p className={styles.empty}>No new unreviewed opportunities.</p>
        ) : (
          <ul className={styles.list}>
            {newOpps.slice(0, 5).map((opp) => (
              <li key={opp.id}>
                <Link href={`/opportunities/${opp.id}`} className={styles.card}>
                  <GradeBadge grade={opp.lead_grade} />
                  <strong>{opp.title}</strong>
                  <span className={styles.company}>{opp.company_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

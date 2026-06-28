import Link from "next/link";
import { fetchOpportunities } from "@/lib/opportunities/actions";
import { GradeBadge } from "@/components/opportunities/grade-badge";
import styles from "./page.module.css";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStage(stage: string): string {
  return stage.replace(/_/g, " ");
}

export default async function OpportunitiesPage() {
  const opportunities = await fetchOpportunities();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Opportunities</h1>
          <p className={styles.subtitle}>
            Capture, score, and manage real opportunities — every row has a next
            action
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/opportunities/new" className={styles.primaryBtn}>
            + New opportunity
          </Link>
          <Link href="/opportunities/import" className={styles.secondaryBtn}>
            Import CSV / paste
          </Link>
        </div>
      </header>

      {opportunities.length === 0 ? (
        <div className={styles.empty}>
          <p>No opportunities yet.</p>
          <Link href="/opportunities/new">Create your first opportunity</Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Opportunity</th>
                <th>Company</th>
                <th>Stage</th>
                <th>Score</th>
                <th>Est. value</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td>
                    <GradeBadge grade={opp.lead_grade} />
                  </td>
                  <td>
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className={styles.link}
                    >
                      {opp.title}
                    </Link>
                  </td>
                  <td>{opp.company_name}</td>
                  <td>
                    <span className={styles.stage}>
                      {formatStage(opp.stage)}
                    </span>
                  </td>
                  <td>{opp.total_score.toFixed(1)}</td>
                  <td>{formatCurrency(opp.estimated_value)}</td>
                  <td className={styles.nextAction}>{opp.next_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

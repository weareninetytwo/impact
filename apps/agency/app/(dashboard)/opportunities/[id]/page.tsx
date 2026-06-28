import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOpportunity } from "@/lib/opportunities/actions";
import { GradeBadge } from "@/components/opportunities/grade-badge";
import { StageSelect } from "@/components/opportunities/stage-select";
import styles from "./page.module.css";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opp = await fetchOpportunity(id);

  if (!opp) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <Link href="/opportunities" className={styles.back}>
        ← Back to opportunities
      </Link>

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <GradeBadge grade={opp.lead_grade} />
          <StageSelect id={opp.id} current={opp.stage} />
        </div>
        <h1 className={styles.title}>{opp.title}</h1>
        <p className={styles.company}>{opp.company_name}</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Scoring breakdown</h2>
          <dl className={styles.dl}>
            <div>
              <dt>Total score</dt>
              <dd className={styles.highlight}>{opp.total_score.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Fit</dt>
              <dd>{opp.fit_score.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>{opp.urgency_score.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd>{opp.value_score.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{opp.confidence_score.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Est. value</dt>
              <dd>{formatCurrency(opp.estimated_value)}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Signal & source</h2>
          <dl className={styles.dl}>
            <div>
              <dt>Signal type</dt>
              <dd>{opp.signal_type.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{opp.source}</dd>
            </div>
            {opp.source_url && (
              <div>
                <dt>Source URL</dt>
                <dd>
                  <a href={opp.source_url} target="_blank" rel="noreferrer">
                    {opp.source_url}
                  </a>
                </dd>
              </div>
            )}
            {opp.company_website && (
              <div>
                <dt>Website</dt>
                <dd>{opp.company_website}</dd>
              </div>
            )}
            {opp.deadline && (
              <div>
                <dt>Deadline</dt>
                <dd>{new Date(opp.deadline).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className={`${styles.panel} ${styles.full}`}>
          <h2 className={styles.panelTitle}>Signal summary</h2>
          <p className={styles.text}>
            {opp.signal_summary ?? "No signal summary provided."}
          </p>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Next action</h2>
          <p className={styles.nextAction}>{opp.next_action}</p>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Recommended action</h2>
          <p className={styles.text}>{opp.recommended_action}</p>
        </section>

        {opp.notes && (
          <section className={`${styles.panel} ${styles.full}`}>
            <h2 className={styles.panelTitle}>Notes</h2>
            <p className={styles.text}>{opp.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { fetchQualifiedLeads } from "@/lib/pipeline/actions";
import { GradeBadge } from "@/components/opportunities/grade-badge";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function QualificationPage() {
  const items = await fetchQualifiedLeads();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Qualification</h1>
        <p className={styles.subtitle}>
          Pre-vetted A/B leads with discovery questions — only these should get
          closer time.
        </p>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No qualified leads yet.</p>
          <p>
            Run <Link href="/automation">Automation</Link> to generate
            qualification profiles.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(({ opportunity, qualification }) => (
            <article key={opportunity.id} className={styles.card}>
              <div className={styles.meta}>
                <GradeBadge grade={opportunity.lead_grade} /> · score{" "}
                {opportunity.total_score.toFixed(1)}
              </div>
              <h2 className={styles.cardTitle}>
                <Link href={`/opportunities/${opportunity.id}`}>
                  {opportunity.company_name}
                </Link>
              </h2>
              <p className={styles.body}>{qualification.summary}</p>
              <p className={styles.body}>
                <strong>Discovery:</strong>{" "}
                {qualification.discovery_questions.join(" · ")}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

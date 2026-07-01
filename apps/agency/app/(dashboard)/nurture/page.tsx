import Link from "next/link";
import {
  fetchNurtureEnrollments,
  fetchOpportunityMap,
} from "@/lib/pipeline/actions";
import type { NurtureArtifact } from "@impact/shared";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function NurturePage() {
  const [enrollments, oppMap] = await Promise.all([
    fetchNurtureEnrollments(),
    fetchOpportunityMap(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nurture</h1>
        <p className={styles.subtitle}>
          C/D-grade sequences — automated education before human time.
        </p>
      </header>

      {enrollments.length === 0 ? (
        <div className={styles.empty}>
          <p>No active nurture enrollments.</p>
          <p>
            Run <Link href="/automation">Automation</Link> to enroll C/D leads.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {enrollments.map((item) => {
            const opp = item.opportunity_id
              ? oppMap.get(item.opportunity_id)
              : null;
            const nurture = item.payload as unknown as NurtureArtifact;
            return (
              <article key={item.id} className={styles.card}>
                <span className={styles.badge}>{nurture.status}</span>
                <h2 className={styles.cardTitle}>
                  {opp ? (
                    <Link href={`/opportunities/${opp.id}`}>
                      {opp.company_name}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h2>
                <p className={styles.meta}>{nurture.sequence_name}</p>
                <p className={styles.body}>
                  Step {nurture.current_step} of {nurture.total_steps} ·{" "}
                  {nurture.next_touch}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

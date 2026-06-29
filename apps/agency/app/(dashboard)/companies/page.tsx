import Link from "next/link";
import {
  fetchCompanyArtifacts,
  fetchOpportunityMap,
} from "@/lib/pipeline/actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function CompaniesPage() {
  const [companies, oppMap] = await Promise.all([
    fetchCompanyArtifacts(),
    fetchOpportunityMap(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Companies</h1>
        <p className={styles.subtitle}>
          Company records synced from your opportunity pipeline.
        </p>
      </header>

      {companies.length === 0 ? (
        <div className={styles.empty}>
          <p>No company records yet.</p>
          <p>
            Run <Link href="/automation">Automation</Link> to sync from
            opportunities.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {companies.map((item) => {
            const opp = item.opportunity_id
              ? oppMap.get(item.opportunity_id)
              : null;
            const website = item.payload.website as string | undefined;
            return (
              <article key={item.id} className={styles.card}>
                <h2 className={styles.cardTitle}>
                  {opp ? (
                    <Link href={`/opportunities/${opp.id}`}>{item.title}</Link>
                  ) : (
                    item.title
                  )}
                </h2>
                {website && <p className={styles.meta}>{website}</p>}
                {opp && (
                  <p className={styles.body}>
                    Active opportunity: {opp.title} (grade {opp.lead_grade})
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import {
  fetchContactArtifacts,
  fetchOpportunityMap,
} from "@/lib/pipeline/actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export default async function ContactsPage() {
  const [contacts, oppMap] = await Promise.all([
    fetchContactArtifacts(),
    fetchOpportunityMap(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Contacts</h1>
        <p className={styles.subtitle}>
          Decision-maker placeholders — add emails in Outreach drafts until
          Apollo sync ships.
        </p>
      </header>

      {contacts.length === 0 ? (
        <div className={styles.empty}>
          <p>No contacts yet.</p>
          <p>
            Add recipient emails on{" "}
            <Link href="/outreach">Outreach</Link> drafts for each lead.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {contacts.map((item) => {
            const opp = item.opportunity_id
              ? oppMap.get(item.opportunity_id)
              : null;
            const email = String(item.payload.email ?? "—");
            const role = String(item.payload.role ?? "decision_maker");
            return (
              <article key={item.id} className={styles.card}>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                {opp && (
                  <p className={styles.meta}>
                    <Link href={`/opportunities/${opp.id}`}>
                      {opp.company_name}
                    </Link>
                  </p>
                )}
                <p className={styles.body}>
                  {email} · {role.replace(/_/g, " ")}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

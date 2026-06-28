import Link from "next/link";
import {
  fetchLinkedKnowledge,
  fetchKnowledgeItems,
} from "@/lib/knowledge/actions";
import { OpportunityKnowledgePanel, UnlinkKnowledgeButton } from "@/components/knowledge/opportunity-knowledge-panel";
import styles from "./opportunity-knowledge.module.css";

export async function OpportunityKnowledgeSection({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [linked, allItems] = await Promise.all([
    fetchLinkedKnowledge(opportunityId),
    fetchKnowledgeItems(),
  ]);

  const linkedIds = new Set(linked.map((i) => i.id));
  const available = allItems.filter((i) => !linkedIds.has(i.id));

  return (
    <section className={`${styles.panel} ${styles.full}`}>
      <h2 className={styles.panelTitle}>Linked knowledge</h2>
      {linked.length === 0 ? (
        <p className={styles.empty}>No knowledge linked yet.</p>
      ) : (
        <ul className={styles.list}>
          {linked.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <Link href={`/knowledge/${item.id}`} className={styles.link}>
                {item.title}
              </Link>
              <span className={styles.type}>{item.type.replace(/_/g, " ")}</span>
              <UnlinkKnowledgeButton
                opportunityId={opportunityId}
                knowledgeItemId={item.id}
              />
            </li>
          ))}
        </ul>
      )}
      <OpportunityKnowledgePanel
        opportunityId={opportunityId}
        available={available.map((i) => ({
          id: i.id,
          label: `${itemLabel(i.title)} (${i.type})`,
        }))}
        linkedIds={[...linkedIds]}
      />
    </section>
  );
}

function itemLabel(title: string): string {
  return title.length > 48 ? `${title.slice(0, 45)}…` : title;
}

import Link from "next/link";
import { fetchOutreachQueue } from "@/lib/outreach/actions";
import { OutreachDraftCard } from "@/components/outreach/outreach-draft-card";
import { OutreachToolbar } from "@/components/outreach/outreach-toolbar";
import styles from "./page.module.css";

export default async function OutreachPage() {
  const queue = await fetchOutreachQueue();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Outreach</h1>
          <p className={styles.subtitle}>
            Prep email drafts tonight. Open Gmail tomorrow morning and send.
          </p>
        </div>
        <Link href="/opportunities" className={styles.link}>
          View pipeline →
        </Link>
      </header>

      <OutreachToolbar queueCount={queue.length} />

      {queue.length === 0 ? (
        <div className={styles.empty}>
          <p>No leads in the send queue yet.</p>
          <p className={styles.emptyHint}>
            Add opportunities via{" "}
            <Link href="/opportunities/import">import</Link> or approve imports
            in <Link href="/signals/review">review</Link>. A/B/C grades appear
            here automatically.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {queue.map((item) => (
            <OutreachDraftCard key={item.opportunity.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

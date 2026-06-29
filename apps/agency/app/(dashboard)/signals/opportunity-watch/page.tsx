import Link from "next/link";
import { fetchOpportunityWatchDashboard } from "@/lib/opportunity-watch/actions";
import { OpportunityWatchPanel } from "@/components/opportunity-watch/opportunity-watch-panel";
import styles from "./page.module.css";

export default async function OpportunityWatchPage() {
  const data = await fetchOpportunityWatchDashboard();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Opportunity Watch</h1>
          <p className={styles.subtitle}>
            Daily discovery runner — replaces chat-only updates as the source of
            truth. Results always land in the review queue first.
          </p>
        </div>
        <Link href="/signals" className={styles.backLink}>
          ← Signals
        </Link>
      </header>

      <aside className={styles.note}>
        <p>
          <strong>ChatGPT task updates alone do not import.</strong> Only API
          calls (GPT Action, Opportunity Watch Runner, Scout, or manual import)
          create <code>signal_imports</code> rows. Wire your GPT Action to{" "}
          <code>POST /api/opportunity-watch/import</code> or run this runner on
          a schedule.
        </p>
      </aside>

      <OpportunityWatchPanel {...data} />
    </div>
  );
}

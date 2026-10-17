import Link from "next/link";
import type { NurtureArtifact } from "@impact/shared";
import {
  AddQuoteForm,
  DueFollowUpsPanel,
  QuoteListPanel,
} from "@/components/nurture/quote-follow-up";
import {
  fetchNurtureEnrollments,
  fetchOpportunityMap,
} from "@/lib/pipeline/actions";
import { fetchQuoteFollowUpDashboard } from "@/lib/quotes/actions";
import pipelineStyles from "@/components/pipeline/pipeline-page.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function formatRate(rate: number | null, sample: number): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}% (n=${sample})`;
}

/** Automated C/D-grade lead sequences (production lineage). */
async function LeadSequences() {
  const [enrollments, oppMap] = await Promise.all([
    fetchNurtureEnrollments(),
    fetchOpportunityMap(),
  ]);

  if (enrollments.length === 0) {
    return (
      <div className={pipelineStyles.empty}>
        <p>No active nurture enrollments.</p>
        <p>
          Run <Link href="/automation">Automation</Link> to enroll C/D leads.
        </p>
      </div>
    );
  }

  return (
    <div className={pipelineStyles.list}>
      {enrollments.map((item) => {
        const opp = item.opportunity_id ? oppMap.get(item.opportunity_id) : null;
        const nurture = item.payload as unknown as NurtureArtifact;
        return (
          <article key={item.id} className={pipelineStyles.card}>
            <span className={pipelineStyles.badge}>{nurture.status}</span>
            <h2 className={pipelineStyles.cardTitle}>
              {opp ? (
                <Link href={`/opportunities/${opp.id}`}>{opp.company_name}</Link>
              ) : (
                item.title
              )}
            </h2>
            <p className={pipelineStyles.meta}>{nurture.sequence_name}</p>
            <p className={pipelineStyles.body}>
              Step {nurture.current_step} of {nurture.total_steps} ·{" "}
              {nurture.next_touch}
            </p>
          </article>
        );
      })}
    </div>
  );
}

/** Day 2/5/10 follow-ups on sent quotes (Epic 5A). */
async function QuoteFollowUp() {
  const { due, quotes, stats, claudeEnabled } =
    await fetchQuoteFollowUpDashboard();

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.due_count}</span>
          <span className={styles.statLabel}>Due today</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.open_count}</span>
          <span className={styles.statLabel}>
            Open quotes · {formatMoney(stats.open_value)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.won_count}</span>
          <span className={styles.statLabel}>
            Won · {formatMoney(stats.won_value)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatRate(stats.win_rate_followed_up, stats.closed_followed_up)}
          </span>
          <span className={styles.statLabel}>Win rate with follow-up</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatRate(
              stats.win_rate_not_followed_up,
              stats.closed_not_followed_up,
            )}
          </span>
          <span className={styles.statLabel}>Win rate without</span>
        </div>
      </div>

      <DueFollowUpsPanel due={due} claudeEnabled={claudeEnabled} />
      <AddQuoteForm />
      <QuoteListPanel quotes={quotes} />

      <section className={styles.note}>
        <p>
          {claudeEnabled
            ? "Claude drafting is on — use Redraft with Claude on any due follow-up."
            : "Drafts use templates. Set ANTHROPIC_API_KEY to enable Redraft with Claude."}{" "}
          Quoting tools can log quotes automatically via{" "}
          <code>POST /api/quotes/import</code> (Bearer{" "}
          <code>IMPACT_INGEST_SECRET</code>).
        </p>
      </section>
    </>
  );
}

export default async function NurturePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const active = view === "quotes" ? "quotes" : "leads";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nurture</h1>
        <p className={styles.subtitle}>
          {active === "quotes"
            ? "Every sent quote gets follow-ups on day 2, 5 and 10. Review each draft, send it from your own email, and mark it sent. Marking a quote won or lost stops its sequence."
            : "C/D-grade sequences — automated education before human time."}
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Nurture views">
        <Link
          href="/nurture"
          className={active === "leads" ? styles.tabActive : styles.tab}
        >
          Lead sequences
        </Link>
        <Link
          href="/nurture?view=quotes"
          className={active === "quotes" ? styles.tabActive : styles.tab}
        >
          Quote follow-up
        </Link>
      </nav>

      {active === "quotes" ? <QuoteFollowUp /> : <LeadSequences />}
    </div>
  );
}

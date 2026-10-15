import {
  AddQuoteForm,
  DueFollowUpsPanel,
  QuoteListPanel,
} from "@/components/nurture/quote-follow-up";
import { fetchQuoteFollowUpDashboard } from "@/lib/quotes/actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function formatRate(rate: number | null, sample: number): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}% (n=${sample})`;
}

export default async function NurturePage() {
  const { due, quotes, stats, claudeEnabled } =
    await fetchQuoteFollowUpDashboard();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quote follow-up</h1>
        <p className={styles.subtitle}>
          Every sent quote gets follow-ups on day 2, 5 and 10. Review each
          draft, send it from your own email, and mark it sent. Marking a quote
          won or lost stops its sequence.
        </p>
      </header>

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
    </div>
  );
}

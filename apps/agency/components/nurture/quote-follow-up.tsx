"use client";

import { useState, useTransition } from "react";
import type { DueFollowUp, QuoteWithFollowUps } from "@impact/shared";
import {
  closeQuoteAction,
  createQuoteAction,
  markFollowUpSentAction,
  redraftFollowUpAction,
  saveFollowUpDraftAction,
  skipFollowUpAction,
} from "@/lib/quotes/actions";
import styles from "./quote-follow-up.module.css";

function formatMoney(amount: number | null): string {
  if (amount == null) return "—";
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildMailto(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

interface DueCardProps {
  followUp: DueFollowUp;
  claudeEnabled: boolean;
}

function DueCard({ followUp, claudeEnabled }: DueCardProps) {
  const { quote } = followUp;
  const [subject, setSubject] = useState(followUp.subject);
  const [body, setBody] = useState(followUp.body);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = subject !== followUp.subject || body !== followUp.body;

  // On success the page revalidates and this card leaves the queue
  function run(action: () => Promise<{ ok: true } | { error: string }>) {
    setStatus(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setStatus(result.error);
    });
  }

  function handleSent() {
    run(async () => {
      if (dirty) {
        const saved = await saveFollowUpDraftAction(followUp.id, subject, body);
        if ("error" in saved) return saved;
      }
      return markFollowUpSentAction(followUp.id);
    });
  }

  function handleRedraft() {
    setStatus(null);
    startTransition(async () => {
      const result = await redraftFollowUpAction(followUp.id);
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      setSubject(result.subject);
      setBody(result.body);
      setStatus("Redrafted by Claude — review before sending.");
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setStatus("Copied — paste into your email or text.");
    } catch {
      setStatus("Copy failed — select the text manually.");
    }
  }

  const overdue = new Date(followUp.due_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            {quote.customer_name}
            {quote.company_name ? ` · ${quote.company_name}` : ""}
          </h3>
          <p className={styles.meta}>
            {quote.job_type ?? "Quote"} · {formatMoney(quote.amount)} · sent{" "}
            {formatDate(quote.quote_sent_at)}
          </p>
        </div>
        <span className={overdue ? styles.badgeOverdue : styles.badge}>
          Step {followUp.step}/3 · due {formatDate(followUp.due_at)}
        </span>
      </div>

      <label className={styles.field}>
        Subject
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className={styles.field}>
        Message
        <textarea
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <div className={styles.actions}>
        {quote.contact_email ? (
          <a
            className={styles.buttonPrimary}
            href={buildMailto(quote.contact_email, subject, body)}
          >
            Open in email
          </a>
        ) : (
          <button type="button" className={styles.buttonPrimary} onClick={handleCopy}>
            Copy message
          </button>
        )}
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={handleSent}
          disabled={isPending}
        >
          Mark sent
        </button>
        {claudeEnabled && (
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={handleRedraft}
            disabled={isPending}
          >
            Redraft with Claude
          </button>
        )}
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => run(() => skipFollowUpAction(followUp.id))}
          disabled={isPending}
        >
          Skip
        </button>
      </div>
      {quote.contact_phone && (
        <p className={styles.meta}>Phone: {quote.contact_phone}</p>
      )}
      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}

export function DueFollowUpsPanel({
  due,
  claudeEnabled,
}: {
  due: DueFollowUp[];
  claudeEnabled: boolean;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Due today ({due.length})</h2>
      {due.length === 0 ? (
        <p className={styles.empty}>
          Nothing due. Log quotes below and follow-ups appear here on day 2, 5
          and 10.
        </p>
      ) : (
        <div className={styles.list}>
          {due.map((followUp) => (
            <DueCard
              key={followUp.id}
              followUp={followUp}
              claudeEnabled={claudeEnabled}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function AddQuoteForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(form: HTMLFormElement) {
    const data = new FormData(form);
    const amountRaw = String(data.get("amount") ?? "").replace(/[$,\s]/g, "");
    const sentAt = String(data.get("quote_sent_at") ?? "");

    setStatus(null);
    startTransition(async () => {
      const result = await createQuoteAction({
        customer_name: String(data.get("customer_name") ?? ""),
        company_name: String(data.get("company_name") ?? ""),
        contact_email: String(data.get("contact_email") ?? ""),
        contact_phone: String(data.get("contact_phone") ?? ""),
        job_type: String(data.get("job_type") ?? ""),
        amount: amountRaw ? Number(amountRaw) : null,
        description: String(data.get("description") ?? ""),
        // Date input gives YYYY-MM-DD; anchor at noon so the day doesn't shift by timezone
        quote_sent_at: sentAt ? `${sentAt}T12:00:00` : null,
      });
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      form.reset();
      setStatus("Quote logged — follow-ups scheduled for day 2, 5 and 10.");
    });
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Log a sent quote</h2>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e.currentTarget);
        }}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            Contact name *
            <input name="customer_name" required placeholder="Maria Lopez" />
          </label>
          <label className={styles.field}>
            Business
            <input name="company_name" placeholder="Lopez Dental" />
          </label>
          <label className={styles.field}>
            Email
            <input name="contact_email" type="email" placeholder="maria@example.com" />
          </label>
          <label className={styles.field}>
            Phone
            <input name="contact_phone" type="tel" />
          </label>
          <label className={styles.field}>
            Job type
            <input name="job_type" placeholder="channel letter storefront sign" />
          </label>
          <label className={styles.field}>
            Amount
            <input name="amount" inputMode="decimal" placeholder="8450" />
          </label>
          <label className={styles.field}>
            Date sent
            <input name="quote_sent_at" type="date" />
          </label>
        </div>
        <label className={styles.field}>
          Notes for follow-ups (optional)
          <textarea
            name="description"
            rows={2}
            placeholder="Illuminated letters, landlord approval pending, wants install before grand opening"
          />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.buttonPrimary} disabled={isPending}>
            Log quote
          </button>
        </div>
        {status && <p className={styles.status}>{status}</p>}
      </form>
    </section>
  );
}

function QuoteRow({ quote }: { quote: QuoteWithFollowUps }) {
  const [current, setCurrent] = useState(quote.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sent = quote.follow_ups.filter((f) => f.status === "sent").length;

  function close(status: "won" | "lost") {
    setError(null);
    startTransition(async () => {
      const result = await closeQuoteAction(quote.id, status);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCurrent(status);
    });
  }

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <strong>{quote.customer_name}</strong>
        {quote.company_name ? ` · ${quote.company_name}` : ""}
        <p className={styles.meta}>
          {quote.job_type ?? "Quote"} · {formatMoney(quote.amount)} · sent{" "}
          {formatDate(quote.quote_sent_at)} · {sent}/3 follow-ups sent
        </p>
        {error && <p className={styles.status}>{error}</p>}
      </div>
      {current === "open" ? (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => close("won")}
            disabled={isPending}
          >
            Won
          </button>
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => close("lost")}
            disabled={isPending}
          >
            Lost
          </button>
        </div>
      ) : (
        <span className={current === "won" ? styles.badgeWon : styles.badgeLost}>
          {current}
        </span>
      )}
    </div>
  );
}

export function QuoteListPanel({ quotes }: { quotes: QuoteWithFollowUps[] }) {
  const open = quotes.filter((q) => q.status === "open");
  const closed = quotes.filter((q) => q.status !== "open").slice(0, 20);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Open quotes ({open.length})</h2>
      {open.length === 0 ? (
        <p className={styles.empty}>No open quotes.</p>
      ) : (
        <div className={styles.rows}>
          {open.map((quote) => (
            <QuoteRow key={quote.id} quote={quote} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Recently closed</h2>
          <div className={styles.rows}>
            {closed.map((quote) => (
              <QuoteRow key={quote.id} quote={quote} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

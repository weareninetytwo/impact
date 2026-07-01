"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildGmailComposeUrl } from "@impact/engines";
import type { StoredOutreachDraft } from "@impact/shared";
import type { OutreachQueueItem } from "@/lib/outreach/actions";
import {
  markOutreachReadyAction,
  markOutreachSentAction,
  saveOutreachDraftAction,
} from "@/lib/outreach/actions";
import { GradeBadge } from "@/components/opportunities/grade-badge";
import styles from "./outreach-draft-card.module.css";

export function OutreachDraftCard({ item }: { item: OutreachQueueItem }) {
  const router = useRouter();
  const { opportunity } = item;
  const [draft, setDraft] = useState<StoredOutreachDraft>(item.draft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(item.hasSavedDraft);

  async function run(
    action: () => Promise<{ ok: true } | { error: string }>,
    onSuccess?: () => void,
  ) {
    setPending(true);
    setError(null);
    const result = await action();
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    onSuccess?.();
    router.refresh();
    setPending(false);
  }

  async function handleSave() {
    await run(() => saveOutreachDraftAction(opportunity.id, draft), () =>
      setSaved(true),
    );
  }

  async function handleCopy() {
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — select text manually");
    }
  }

  const gmailUrl = buildGmailComposeUrl(
    { subject: draft.subject, body: draft.body },
    draft.contactEmail,
  );

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.metaRow}>
            <GradeBadge grade={opportunity.lead_grade} />
            <span className={styles.stage}>
              {opportunity.stage.replace(/_/g, " ")}
            </span>
            {item.knowledgeCount > 0 && (
              <span className={styles.knowledge}>
                {item.knowledgeCount} knowledge link
                {item.knowledgeCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <h2 className={styles.title}>
            <Link href={`/opportunities/${opportunity.id}`}>
              {opportunity.title}
            </Link>
          </h2>
          <p className={styles.company}>{opportunity.company_name}</p>
        </div>
        <div className={styles.score}>{opportunity.total_score.toFixed(1)}</div>
      </div>

      {opportunity.signal_summary && (
        <p className={styles.summary}>{opportunity.signal_summary}</p>
      )}

      <label className={styles.field}>
        <span>To (optional)</span>
        <input
          type="email"
          value={draft.contactEmail}
          onChange={(e) =>
            setDraft((d) => ({ ...d, contactEmail: e.target.value }))
          }
          placeholder="contact@company.com"
        />
      </label>

      <label className={styles.field}>
        <span>Subject</span>
        <input
          type="text"
          value={draft.subject}
          onChange={(e) =>
            setDraft((d) => ({ ...d, subject: e.target.value }))
          }
        />
      </label>

      <label className={styles.field}>
        <span>Email body</span>
        <textarea
          rows={12}
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={pending}
          onClick={handleSave}
        >
          {saved ? "Save changes" : "Save draft"}
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={pending}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={gmailUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.gmail}
          onClick={() => {
            void handleSave();
          }}
        >
          Open in Gmail
        </a>
        <button
          type="button"
          className={styles.secondary}
          disabled={pending}
          onClick={() => run(() => markOutreachReadyAction(opportunity.id))}
        >
          Mark ready
        </button>
        <button
          type="button"
          className={styles.sent}
          disabled={pending}
          onClick={() => run(() => markOutreachSentAction(opportunity.id))}
        >
          Mark sent
        </button>
      </div>
    </article>
  );
}

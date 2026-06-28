"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OpportunityInput, SignalType } from "@impact/shared";
import { SIGNAL_TYPES } from "@impact/shared";
import { createOpportunityAction } from "@/lib/opportunities/actions";
import styles from "./opportunity-form.module.css";

const emptyForm: OpportunityInput = {
  company_name: "",
  company_website: "",
  title: "",
  signal_type: "other",
  source: "manual",
  source_url: "",
  signal_summary: "",
  deadline: "",
  estimated_value: null,
  notes: "",
};

export function OpportunityForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<OpportunityInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof OpportunityInput>(
    key: K,
    value: OpportunityInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createOpportunityAction({
        ...form,
        estimated_value: form.estimated_value
          ? Number(form.estimated_value)
          : null,
      });

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if (!("success" in result) || !result.success || !result.opportunity) {
        setError("Failed to create opportunity");
        return;
      }

      if (result.duplicate && result.updated) {
        setMessage("Existing opportunity updated (dedupe match).");
      }

      router.push(`/opportunities/${result.opportunity.id}`);
      router.refresh();
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          Company name *
          <input
            required
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Website
          <input
            value={form.company_website ?? ""}
            onChange={(e) => update("company_website", e.target.value)}
            placeholder="https://example.com"
          />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          Opportunity title *
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Signal type *
          <select
            value={form.signal_type}
            onChange={(e) =>
              update("signal_type", e.target.value as SignalType)
            }
          >
            {SIGNAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Source *
          <input
            required
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
            placeholder="manual, rfp_watch, apollo_export..."
          />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          Source URL
          <input
            value={form.source_url ?? ""}
            onChange={(e) => update("source_url", e.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          Signal summary
          <textarea
            rows={3}
            value={form.signal_summary ?? ""}
            onChange={(e) => update("signal_summary", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Deadline
          <input
            type="date"
            value={form.deadline?.slice(0, 10) ?? ""}
            onChange={(e) => update("deadline", e.target.value || null)}
          />
        </label>
        <label className={styles.field}>
          Estimated value (USD)
          <input
            type="number"
            min={0}
            value={form.estimated_value ?? ""}
            onChange={(e) =>
              update(
                "estimated_value",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </label>
        <label className={`${styles.field} ${styles.full}`}>
          Notes
          <textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>
      </div>

      <p className={styles.hint}>
        Next action is auto-generated from scoring if left blank.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn} disabled={pending}>
          {pending ? "Scoring..." : "Create & score opportunity"}
        </button>
      </div>
    </form>
  );
}

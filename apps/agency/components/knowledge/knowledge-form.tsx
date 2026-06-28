"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createKnowledgeFromFormAction } from "@/lib/knowledge/actions";
import { KNOWLEDGE_TYPES } from "@impact/shared";
import styles from "./knowledge-form.module.css";

export function KnowledgeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createKnowledgeFromFormAction(formData);
    if ("error" in result && result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if ("item" in result && result.item) {
      router.push(`/knowledge/${result.item.id}`);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <p className={styles.error}>{error}</p>}

      <label className={styles.label}>
        Title
        <input name="title" required className={styles.input} />
      </label>

      <label className={styles.label}>
        Type
        <select name="type" className={styles.input} defaultValue="sop">
          {KNOWLEDGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        Source
        <input
          name="source"
          placeholder="e.g. internal, client name, URL"
          className={styles.input}
        />
      </label>

      <label className={styles.label}>
        Tags (comma-separated)
        <input name="tags" placeholder="web, rates, process" className={styles.input} />
      </label>

      <label className={styles.label}>
        Summary
        <input name="summary" className={styles.input} />
      </label>

      <label className={styles.label}>
        Content (paste text)
        <textarea
          name="content_text"
          rows={12}
          className={styles.textarea}
          placeholder="Paste proposal text, SOP, rate sheet, FAQ…"
        />
      </label>

      <label className={styles.label}>
        File upload (TXT, MD, PDF, DOCX placeholder)
        <input name="file" type="file" accept=".txt,.md,.pdf,.docx" className={styles.file} />
      </label>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : "Save knowledge"}
      </button>
    </form>
  );
}

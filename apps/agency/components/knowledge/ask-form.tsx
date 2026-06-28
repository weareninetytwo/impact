"use client";

import { useState } from "react";
import Link from "next/link";
import { askKnowledgeAction } from "@/lib/knowledge/actions";
import type { KnowledgeAnswer } from "@impact/shared";
import styles from "./ask-form.module.css";

export function AskKnowledgeForm() {
  const [answer, setAnswer] = useState<KnowledgeAnswer | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await askKnowledgeAction(formData);
    setAnswer(result);
    setPending(false);
  }

  return (
    <div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Question
          <input
            name="question"
            required
            className={styles.input}
            placeholder="What is our web process?"
          />
        </label>
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Searching…" : "Search knowledge"}
        </button>
      </form>

      {answer && (
        <div className={styles.result}>
          <p className={styles.mode}>
            Retrieval: {answer.retrieval_mode} (embeddings: future)
          </p>
          <div className={styles.answer}>{answer.answer}</div>
          {answer.sources.length > 0 && (
            <div className={styles.sources}>
              <h3 className={styles.sourcesTitle}>Sources</h3>
              <ul className={styles.sourceList}>
                {answer.sources.map((s) => (
                  <li key={s.knowledge_item_id} className={styles.sourceItem}>
                    <Link href={`/knowledge/${s.knowledge_item_id}`}>
                      {s.title}
                    </Link>
                    <span className={styles.sourceType}>{s.type}</span>
                    <p className={styles.excerpt}>{s.excerpt}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

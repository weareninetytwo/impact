"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkKnowledgeAction } from "@/lib/knowledge/actions";
import styles from "./knowledge-link-form.module.css";

interface Props {
  knowledgeItemId: string;
  opportunities: Array<{ id: string; label: string }>;
}

export function KnowledgeLinkForm({ knowledgeItemId, opportunities }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const opportunityId = String(formData.get("opportunity_id") ?? "");
    if (!opportunityId) return;
    setPending(true);
    await linkKnowledgeAction(opportunityId, knowledgeItemId);
    router.refresh();
    setPending(false);
  }

  if (opportunities.length === 0) {
    return <p className={styles.empty}>No opportunities to link yet.</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <select name="opportunity_id" required className={styles.select}>
        <option value="">Select opportunity…</option>
        {opportunities.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={styles.btn}>
        {pending ? "Linking…" : "Link"}
      </button>
    </form>
  );
}

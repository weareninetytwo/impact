"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  linkKnowledgeAction,
  unlinkKnowledgeAction,
} from "@/lib/knowledge/actions";
import styles from "./opportunity-knowledge-panel.module.css";

interface Props {
  opportunityId: string;
  available: Array<{ id: string; label: string }>;
  linkedIds: string[];
}

export function OpportunityKnowledgePanel({
  opportunityId,
  available,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function link(formData: FormData) {
    const knowledgeItemId = String(formData.get("knowledge_item_id") ?? "");
    if (!knowledgeItemId) return;
    setPending(true);
    await linkKnowledgeAction(opportunityId, knowledgeItemId);
    router.refresh();
    setPending(false);
  }

  if (available.length === 0) {
    return (
      <p className={styles.hint}>
        <Link href="/knowledge/new">Add knowledge</Link> to link assets to this
        opportunity.
      </p>
    );
  }

  return (
    <form action={link} className={styles.form}>
      <select name="knowledge_item_id" className={styles.select}>
        <option value="">Link knowledge item…</option>
        {available.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={styles.btn}>
        {pending ? "…" : "Link"}
      </button>
    </form>
  );
}

export function UnlinkKnowledgeButton({
  opportunityId,
  knowledgeItemId,
}: {
  opportunityId: string;
  knowledgeItemId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleUnlink() {
    setPending(true);
    await unlinkKnowledgeAction(opportunityId, knowledgeItemId);
    router.refresh();
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleUnlink}
      disabled={pending}
      className={styles.unlink}
    >
      Remove
    </button>
  );
}

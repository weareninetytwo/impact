"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProposalStatusAction } from "@/lib/pipeline/actions";
import styles from "@/components/pipeline/pipeline-page.module.css";

export function ProposalActions({
  proposalId,
  content,
  status,
}: {
  proposalId: string;
  content: string;
  status: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function markSent() {
    await updateProposalStatusAction(proposalId, "sent");
    router.refresh();
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.btn} onClick={copy}>
        {copied ? "Copied" : "Copy proposal"}
      </button>
      {status !== "sent" && (
        <button type="button" className={styles.btn} onClick={markSent}>
          Mark sent
        </button>
      )}
    </div>
  );
}

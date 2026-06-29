"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importSignalsAction } from "@/lib/signals/actions";
import { SIGNAL_INGEST_SAMPLE } from "@impact/shared";
import styles from "./import-test-panel.module.css";

export function SignalImportTestPanel() {
  const router = useRouter();
  const [json, setJson] = useState(
    JSON.stringify(SIGNAL_INGEST_SAMPLE, null, 2),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);

    const response = await importSignalsAction(json, "direct");
    if ("error" in response) {
      setError(response.error);
      setPending(false);
      return;
    }

    setResult(
      `${response.created} created, ${response.updated} updated, ${response.queued} queued, ${response.skipped} skipped` +
        (response.knowledge_ids.length
          ? ` · ${response.knowledge_ids.length} source doc(s)`
          : "") +
        (response.signal_import_ids.length
          ? ` · ${response.signal_import_ids.length} in review queue`
          : ""),
    );
    if (response.errors.length) {
      setError(response.errors.slice(0, 5).join("; "));
    }
    router.refresh();
    setPending(false);
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        Paste JSON from ChatGPT or a Custom GPT Action. Uses{" "}
        <code>mode: &quot;direct&quot;</code> here so opportunities land
        immediately. The API defaults to review queue — see{" "}
        <code>/signals/review</code>.
      </p>
      <textarea
        className={styles.textarea}
        rows={18}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
      />
      {error && <p className={styles.error}>{error}</p>}
      {result && <p className={styles.result}>{result}</p>}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Importing…" : "Import signals"}
      </button>
    </form>
  );
}

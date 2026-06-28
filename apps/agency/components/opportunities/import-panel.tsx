"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CSV_TEMPLATE } from "@impact/shared";
import { importCsvAction, importPasteAction } from "@/lib/opportunities/actions";
import styles from "./import-panel.module.css";

type Tab = "csv" | "paste";

export function ImportPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("csv");
  const [csv, setCsv] = useState(CSV_TEMPLATE);
  const [paste, setPaste] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    setError(null);
    setResult(null);

    startTransition(async () => {
      const response =
        tab === "csv"
          ? await importCsvAction(csv)
          : await importPasteAction(paste);

      if ("error" in response && response.error) {
        setError(response.error);
        return;
      }

      if (!("success" in response) || !response.success) return;

      const parts = [
        `${response.created} created`,
        `${response.updated} updated`,
        `${response.skipped} skipped`,
      ];
      setResult(parts.join(", "));

      if (response.errors?.length) {
        setError(response.errors.slice(0, 5).join("; "));
      }

      router.refresh();
    });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === "csv" ? styles.active : undefined}
          onClick={() => setTab("csv")}
        >
          CSV import
        </button>
        <button
          type="button"
          className={tab === "paste" ? styles.active : undefined}
          onClick={() => setTab("paste")}
        >
          Paste import
        </button>
      </div>

      {tab === "csv" ? (
        <textarea
          className={styles.textarea}
          rows={12}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
      ) : (
        <textarea
          className={styles.textarea}
          rows={12}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={`company_name: Northline Health\ntitle: Series B rebrand\nsignal_type: funding\nestimated_value: 125000\n\nOr paste CSV with headers`}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
      {result && <p className={styles.result}>{result}</p>}

      <button
        type="button"
        className={styles.submit}
        onClick={handleImport}
        disabled={pending}
      >
        {pending ? "Importing..." : "Import & score"}
      </button>
    </div>
  );
}

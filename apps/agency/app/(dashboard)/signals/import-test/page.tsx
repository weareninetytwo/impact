import Link from "next/link";
import { SignalImportTestPanel } from "@/components/signals/import-test-panel";
import styles from "./page.module.css";

export default function SignalImportTestPage() {
  return (
    <div className={styles.page}>
      <Link href="/signals" className={styles.back}>
        ← Back to signals
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>Signal import test</h1>
        <p className={styles.subtitle}>
          Manual JSON ingest for ChatGPT → Impact bridge (Epic 3A). Validates,
          dedupes, scores, and attaches source docs to Knowledge.
        </p>
      </header>
      <SignalImportTestPanel />
    </div>
  );
}

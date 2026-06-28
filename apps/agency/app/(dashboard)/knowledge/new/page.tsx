import Link from "next/link";
import { KnowledgeForm } from "@/components/knowledge/knowledge-form";
import styles from "./page.module.css";

export default function NewKnowledgePage() {
  return (
    <div className={styles.page}>
      <Link href="/knowledge" className={styles.back}>
        ← Back to knowledge
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>Add knowledge</h1>
        <p className={styles.subtitle}>
          Paste text or upload TXT/MD. PDF/DOCX stored as placeholder until full
          extraction in a later epic.
        </p>
      </header>
      <KnowledgeForm />
    </div>
  );
}

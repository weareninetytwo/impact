import Link from "next/link";
import { AskKnowledgeForm } from "@/components/knowledge/ask-form";
import styles from "./page.module.css";

export default function AskKnowledgePage() {
  return (
    <div className={styles.page}>
      <Link href="/knowledge" className={styles.back}>
        ← Back to knowledge
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>Ask Impact</h1>
        <p className={styles.subtitle}>
          Keyword search over your knowledge base — no OpenAI required. Future:
          embedding RAG.
        </p>
      </header>
      <AskKnowledgeForm />
      <p className={styles.hint}>
        Try: &quot;what is our web process?&quot; or &quot;what rates do we
        use?&quot;
      </p>
    </div>
  );
}

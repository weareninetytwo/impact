import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchKnowledgeItem,
  fetchKnowledgeChunks,
  fetchAllOpportunitiesForLinking,
} from "@/lib/knowledge/actions";
import { KnowledgeLinkForm } from "@/components/knowledge/knowledge-link-form";
import styles from "./page.module.css";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, chunks, opportunities] = await Promise.all([
    fetchKnowledgeItem(id),
    fetchKnowledgeChunks(id),
    fetchAllOpportunitiesForLinking(),
  ]);

  if (!item) notFound();

  return (
    <div className={styles.page}>
      <Link href="/knowledge" className={styles.back}>
        ← Back to knowledge
      </Link>

      <header className={styles.header}>
        <span className={styles.typeBadge}>{item.type.replace(/_/g, " ")}</span>
        <h1 className={styles.title}>{item.title}</h1>
        {item.summary && <p className={styles.summary}>{item.summary}</p>}
        {item.source && <p className={styles.meta}>Source: {item.source}</p>}
        {item.file_name && (
          <p className={styles.meta}>
            File: {item.file_name}
            {item.mime_type ? ` (${item.mime_type})` : ""}
          </p>
        )}
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Content preview</h2>
          <pre className={styles.content}>
            {item.content_text.slice(0, 2000)}
            {item.content_text.length > 2000 ? "…" : ""}
          </pre>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Chunks ({chunks.length})</h2>
          <p className={styles.hint}>
            Indexed for keyword retrieval. Embeddings: future epic.
          </p>
          <ul className={styles.chunkList}>
            {chunks.slice(0, 5).map((c) => (
              <li key={c.id} className={styles.chunk}>
                <span className={styles.chunkIndex}>#{c.chunk_index + 1}</span>
                {c.content.slice(0, 200)}
                {c.content.length > 200 ? "…" : ""}
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.full}`}>
          <h2 className={styles.panelTitle}>Link to opportunity</h2>
          <KnowledgeLinkForm
            knowledgeItemId={item.id}
            opportunities={opportunities.map((o) => ({
              id: o.id,
              label: `${o.company_name} — ${o.title}`,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

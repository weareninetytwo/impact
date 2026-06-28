import Link from "next/link";
import { fetchKnowledgeItems } from "@/lib/knowledge/actions";
import { KNOWLEDGE_TYPES } from "@impact/shared";
import styles from "./page.module.css";

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const items = await fetchKnowledgeItems({
    query: params.q,
    type: params.type,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge</h1>
          <p className={styles.subtitle}>
            Proposals, SOPs, rates, and case studies — grounded context for
            every agent and proposal
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/knowledge/new" className={styles.primaryBtn}>
            + Add knowledge
          </Link>
          <Link href="/knowledge/ask" className={styles.secondaryBtn}>
            Ask Impact
          </Link>
        </div>
      </header>

      <form className={styles.filters} method="get">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title or content…"
          className={styles.searchInput}
        />
        <select name="type" defaultValue={params.type ?? "all"} className={styles.select}>
          <option value="all">All types</option>
          {KNOWLEDGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {formatType(t)}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.filterBtn}>
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No knowledge items yet.</p>
          <Link href="/knowledge/new">Add your first asset</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <Link key={item.id} href={`/knowledge/${item.id}`} className={styles.card}>
              <div className={styles.cardMeta}>
                <span className={styles.typeBadge}>{formatType(item.type)}</span>
                <span className={styles.chunkCount}>{item.chunk_count} chunks</span>
              </div>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.summary && <p className={styles.cardSummary}>{item.summary}</p>}
              {item.tags.length > 0 && (
                <div className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

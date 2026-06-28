import type {
  KnowledgeAnswer,
  KnowledgeChunk,
  KnowledgeItem,
  KnowledgeSearchParams,
  RetrievedChunk,
} from "@impact/shared";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "what", "which", "who", "how", "our", "your", "we", "you", "they", "it",
  "this", "that", "and", "but", "or", "if", "not", "no",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreChunk(content: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const lower = content.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (lower.includes(term)) {
      const count = lower.split(term).length - 1;
      score += count * (term.length > 5 ? 2 : 1);
    }
  }
  return score;
}

export function rankChunks(
  chunks: KnowledgeChunk[],
  itemsById: Map<string, KnowledgeItem>,
  query: string,
  limit = 5,
): RetrievedChunk[] {
  const terms = tokenize(query);
  const ranked: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const item = itemsById.get(chunk.knowledge_item_id);
    if (!item) continue;
    const score = scoreChunk(chunk.content, terms);
    if (score > 0) ranked.push({ chunk, item, score });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

export function buildKeywordAnswer(
  question: string,
  retrieved: RetrievedChunk[],
): KnowledgeAnswer {
  if (retrieved.length === 0) {
    return {
      question,
      answer:
        "No matching knowledge found. Add SOPs, rate sheets, or proposals in Knowledge, then try again.",
      sources: [],
      retrieval_mode: "keyword",
    };
  }

  const seen = new Set<string>();
  const sources: KnowledgeAnswer["sources"] = [];

  for (const { chunk, item, score } of retrieved) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const excerpt =
      chunk.content.length > 280
        ? `${chunk.content.slice(0, 277)}…`
        : chunk.content;
    sources.push({
      knowledge_item_id: item.id,
      title: item.title,
      type: item.type,
      excerpt,
      score,
    });
  }

  const lines = retrieved.slice(0, 3).map(({ item, chunk }) => {
    const excerpt =
      chunk.content.length > 400
        ? `${chunk.content.slice(0, 397)}…`
        : chunk.content;
    return `**${item.title}** (${item.type}): ${excerpt}`;
  });

  return {
    question,
    answer: `Based on ${sources.length} knowledge source(s):\n\n${lines.join("\n\n")}`,
    sources,
    retrieval_mode: "keyword",
  };
}

/** Placeholder for future embedding/RAG — not used in Epic 2.5 */
export function embeddingRetrievePlaceholder(): never {
  throw new Error(
    "Embedding retrieval not enabled. Configure pgvector + OpenAI in a future epic.",
  );
}

export function filterItems(
  items: KnowledgeItem[],
  params: KnowledgeSearchParams,
): KnowledgeItem[] {
  let result = [...items];

  if (params.type && params.type !== "all") {
    result = result.filter((i) => i.type === params.type);
  }

  if (params.query?.trim()) {
    const q = params.query.toLowerCase();
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.content_text.toLowerCase().includes(q) ||
        i.summary?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return result.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

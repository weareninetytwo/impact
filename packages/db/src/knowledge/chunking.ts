const MAX_CHUNK = 1200;
const MIN_CHUNK = 80;

/** Simple paragraph-aware chunking for keyword retrieval MVP. */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length + 2 <= MAX_CHUNK) {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
      continue;
    }

    if (buffer) {
      chunks.push(buffer);
      buffer = "";
    }

    if (para.length <= MAX_CHUNK) {
      buffer = para;
      continue;
    }

    let rest = para;
    while (rest.length > MAX_CHUNK) {
      const slice = rest.slice(0, MAX_CHUNK);
      const breakAt = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("\n"),
      );
      const cut = breakAt > MIN_CHUNK ? breakAt + 1 : MAX_CHUNK;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    buffer = rest;
  }

  if (buffer.trim()) chunks.push(buffer.trim());

  return chunks.filter((c) => c.length >= MIN_CHUNK || chunks.length === 0);
}

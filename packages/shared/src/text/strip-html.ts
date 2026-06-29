/** Strip HTML tags and collapse whitespace for RSS/API display text. */
export function stripHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeXmlEntities(text: string): string {
  return stripHtml(
    text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, code) =>
        String.fromCharCode(Number.parseInt(code, 10)),
      )
      .trim(),
  );
}

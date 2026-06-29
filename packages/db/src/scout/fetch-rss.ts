export interface RawScoutItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

function extractTag(block: string, tag: string): string | undefined {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = block.match(cdata);
  if (cdataMatch?.[1]) return decodeXmlEntities(cdataMatch[1]);

  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const plainMatch = block.match(plain);
  if (plainMatch?.[1]) return decodeXmlEntities(plainMatch[1]);

  return undefined;
}

export function parseRssFeed(xml: string): RawScoutItem[] {
  const items: RawScoutItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    const link =
      extractTag(block, "link") ??
      block.match(/<link[^>]*href="([^"]+)"/i)?.[1];

    if (!title || !link) continue;

    items.push({
      title,
      link: link.trim(),
      description: extractTag(block, "description") ?? extractTag(block, "summary"),
      pubDate: extractTag(block, "pubDate") ?? extractTag(block, "published"),
    });
  }

  if (items.length === 0) {
    const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
    for (const block of entryBlocks) {
      const title = extractTag(block, "title");
      const link =
        block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ??
        extractTag(block, "link");
      if (!title || !link) continue;
      items.push({
        title,
        link: link.trim(),
        description: extractTag(block, "summary") ?? extractTag(block, "content"),
        pubDate: extractTag(block, "updated") ?? extractTag(block, "published"),
      });
    }
  }

  return items;
}

export async function fetchRssItems(feedUrl: string): Promise<RawScoutItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Impact-Scout/1.0 (+https://impact.weareninetytwo.xyz)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed (${response.status})`);
  }

  const xml = await response.text();
  const items = parseRssFeed(xml);
  if (items.length === 0) {
    throw new Error("RSS feed returned no parseable items");
  }
  return items.slice(0, 25);
}

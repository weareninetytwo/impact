import type { RawScoutItem } from "./fetch-rss";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractMeta(html: string, property: string): string | undefined {
  const og = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const ogAlt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i",
  );
  return decodeHtmlEntities(
    html.match(og)?.[1] ?? html.match(ogAlt)?.[1] ?? "",
  ) || undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractDescription(html: string): string | undefined {
  const og = extractMeta(html, "og:description");
  if (og) return og;
  const match = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const pattern = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const href = match[1];
      if (!href || href.startsWith("javascript:") || href.startsWith("mailto:")) {
        continue;
      }
      const resolved = new URL(href, baseUrl).toString();
      if (resolved.startsWith("http")) {
        links.add(resolved);
      }
    } catch {
      /* skip invalid URLs */
    }
  }
  return [...links].slice(0, 10);
}

export async function fetchHtmlItems(pageUrl: string): Promise<RawScoutItem[]> {
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Impact-Scout/1.0 (+https://impact.weareninetytwo.xyz)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTML fetch failed (${response.status})`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const description = extractDescription(html);

  if (!title) {
    throw new Error("HTML page has no extractable title");
  }

  const items: RawScoutItem[] = [
    {
      title,
      link: pageUrl,
      description,
    },
  ];

  for (const link of extractLinks(html, pageUrl)) {
    if (link === pageUrl) continue;
    const slug = link.split("/").filter(Boolean).pop() ?? link;
    items.push({
      title: `${title} — ${slug}`,
      link,
      description,
    });
    if (items.length >= 10) break;
  }

  return items;
}

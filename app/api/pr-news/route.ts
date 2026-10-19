import { NextResponse } from "next/server";

// Google News RSS — no API key needed.
// Fetches news articles mentioning "타이거리서치" (KR) and "Tiger Research" (EN/global).
// Returns a unified, de-duplicated list sorted by publication date desc.

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;       // ISO
  source: string;        // publisher name
  snippet?: string;
  lang: "ko" | "en" | "mixed";
}

function buildFeeds(): { url: string; lang: "ko" | "en" | "mixed" }[] {
  const feeds: { url: string; lang: "ko" | "en" | "mixed" }[] = [
    {
      url: "https://news.google.com/rss/search?q=%22%ED%83%80%EC%9D%B4%EA%B1%B0%EB%A6%AC%EC%84%9C%EC%B9%98%22&hl=ko&gl=KR&ceid=KR:ko",
      lang: "ko",
    },
    {
      url: "https://news.google.com/rss/search?q=%22Tiger+Research%22+crypto&hl=en&gl=US&ceid=US:en",
      lang: "en",
    },
  ];
  // Google Alerts RSS: catches hits News doesn't surface + fires on new matches
  const alerts = process.env.GOOGLE_ALERTS_RSS;
  if (alerts) feeds.push({ url: alerts, lang: "mixed" });
  return feeds;
}

async function fetchFeed(url: string, lang: "ko" | "en" | "mixed"): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];

    // Google Alerts uses Atom format with <entry>; Google News uses RSS <item>.
    const isAtom = xml.includes("<entry>") || xml.includes("<entry ");
    if (isAtom) {
      const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
      const titleRe = /<title[^>]*>([\s\S]*?)<\/title>/;
      const linkRe = /<link[^>]*href="([^"]+)"/;
      const dateRe = /<published>([\s\S]*?)<\/published>|<updated>([\s\S]*?)<\/updated>/;
      const contentRe = /<content[^>]*>([\s\S]*?)<\/content>/;
      let m;
      while ((m = entryRe.exec(xml)) !== null) {
        const block = m[1];
        const t = titleRe.exec(block);
        const l = linkRe.exec(block);
        const d = dateRe.exec(block);
        const c = contentRe.exec(block);
        if (!t || !l) continue;
        const title = (t[1] || "").replace(/<[^>]+>/g, "").trim();
        const link = (l[1] || "").trim();
        // Alerts links are google.com/url?... — keep for now; could redirect.
        const pubDate = d?.[1] || d?.[2] ? new Date(d[1] || d[2]).toISOString() : "";
        const snippet = (c?.[1] || "").replace(/<[^>]+>/g, "").trim().slice(0, 300);
        // Detect language by content
        const detectedLang: "ko" | "en" | "mixed" = /[가-힣]/.test(title + snippet) ? "ko" : "en";
        items.push({ title, link, pubDate, source: "Google Alerts", snippet, lang: lang === "mixed" ? detectedLang : lang });
      }
      return items;
    }

    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    const titleRe = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
    const linkRe = /<link>([\s\S]*?)<\/link>/;
    const dateRe = /<pubDate>([\s\S]*?)<\/pubDate>/;
    const descRe = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/;
    const sourceRe = /<source[^>]*>([\s\S]*?)<\/source>/;

    let m;
    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1];
      const t = titleRe.exec(block);
      const l = linkRe.exec(block);
      const d = dateRe.exec(block);
      const dsc = descRe.exec(block);
      const src = sourceRe.exec(block);
      if (!t || !l) continue;
      const title = (t[1] || t[2] || "").trim();
      const link = (l[1] || "").trim();
      const pubDate = d?.[1] ? new Date(d[1]).toISOString() : "";
      const snippetRaw = ((dsc?.[1] || dsc?.[2]) ?? "").trim();
      // Strip HTML tags from snippet
      const snippet = snippetRaw.replace(/<[^>]+>/g, "").slice(0, 300);
      // Google News embeds publisher name in title after " - " and also in <source>
      let source = (src?.[1] || "").trim();
      let displayTitle = title;
      if (!source && title.includes(" - ")) {
        const parts = title.split(" - ");
        source = parts[parts.length - 1].trim();
        displayTitle = parts.slice(0, -1).join(" - ").trim();
      }
      items.push({ title: displayTitle, link, pubDate, source: source || "Unknown", snippet, lang });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") || "30");
  const cutoff = Date.now() - days * 86400000;

  const feeds = buildFeeds();
  const results = await Promise.all(feeds.map((f) => fetchFeed(f.url, f.lang)));
  const all = results.flat();

  // De-duplicate by link (strip Google News redirect params)
  const seen = new Set<string>();
  const dedup: NewsItem[] = [];
  for (const n of all) {
    const key = n.link.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    const t = new Date(n.pubDate).getTime();
    if (t && t >= cutoff) dedup.push(n);
  }

  // Sort by date desc
  dedup.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  // Group by source for a quick breakdown
  const bySource: Record<string, number> = {};
  for (const n of dedup) bySource[n.source] = (bySource[n.source] || 0) + 1;

  const bySourceSorted = Object.entries(bySource)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Split KR / EN counts
  const krCount = dedup.filter((n) => n.lang === "ko").length;
  const enCount = dedup.filter((n) => n.lang === "en").length;

  return NextResponse.json({
    windowDays: days,
    total: dedup.length,
    krCount,
    enCount,
    bySource: bySourceSorted,
    items: dedup,
  });
}

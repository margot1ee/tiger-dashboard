import { NextResponse } from "next/server";

// Matches PR news articles to a specific research by publication date proximity
// and keyword overlap with the title.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "";
  const pubDate = url.searchParams.get("pubDate") || "";
  const windowDays = Number(url.searchParams.get("windowDays") || "30");
  if (!title || !pubDate) {
    return NextResponse.json({ error: "title & pubDate required" }, { status: 400 });
  }
  const base = `${url.protocol}//${url.host}`;

  const pubTime = new Date(pubDate).getTime();

  try {
    const r = await fetch(`${base}/api/pr-news?days=180`, {
      next: { revalidate: 1800 },
    });
    if (!r.ok) {
      return NextResponse.json({ error: `pr-news fetch failed: ${r.status}` }, { status: 502 });
    }
    const data = (await r.json()) as {
      items?: { title: string; link: string; pubDate: string; source: string; snippet?: string; lang?: string }[];
    };

    // Keyword extraction: pull meaningful words from the research title
    const stopwords = new Set([
      "the","a","an","of","to","for","and","or","in","on","with","by","from",
      "리서치","분석","전망","보고서","beyond","toward","is","are","will","can","why","how",
    ]);
    const keywords = title
      .toLowerCase()
      .split(/[^a-z0-9가-힣]+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    const matches: {
      title: string;
      link: string;
      pubDate: string;
      source: string;
      snippet?: string;
      lang?: string;
      score: number;
      daysAfterPub: number;
    }[] = [];

    for (const item of data.items ?? []) {
      const t = new Date(item.pubDate).getTime();
      if (!t) continue;
      const diffDays = (t - pubTime) / 86400000;
      // PR usually comes AFTER research publishes (within window)
      if (diffDays < -2 || diffDays > windowDays) continue;
      const haystack = `${item.title} ${item.snippet || ""}`.toLowerCase();
      let score = 0;
      for (const k of keywords) if (haystack.includes(k)) score++;
      if (score === 0) continue;
      matches.push({ ...item, score, daysAfterPub: Math.round(diffDays * 10) / 10 });
    }
    matches.sort((a, b) => b.score - a.score);
    const bySource: Record<string, number> = {};
    for (const m of matches) bySource[m.source] = (bySource[m.source] || 0) + 1;
    return NextResponse.json({
      total: matches.length,
      bySource: Object.entries(bySource).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
      matches,
      keywordsUsed: keywords,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

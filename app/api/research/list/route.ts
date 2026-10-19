import { NextResponse } from "next/server";

// Returns a unified list of Tiger Research publications from Substack RSS,
// which is the canonical source of research posts.
interface SubstackRssPost {
  title: string;
  slug: string;      // the trailing path segment
  link: string;      // full URL
  pubDate: string;   // ISO
  description: string;
}

const RSS_URL = "https://reports.tiger-research.com/feed";

async function fetchRss(): Promise<SubstackRssPost[]> {
  const res = await fetch(RSS_URL, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items: SubstackRssPost[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const titleRe = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
  const linkRe = /<link>([\s\S]*?)<\/link>/;
  const dateRe = /<pubDate>([\s\S]*?)<\/pubDate>/;
  const descRe = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const t = titleRe.exec(block);
    const l = linkRe.exec(block);
    const d = dateRe.exec(block);
    const dsc = descRe.exec(block);
    if (!t || !l) continue;
    const title = (t[1] || t[2] || "").trim();
    const link = (l[1] || "").trim();
    const slug = link.split("/").filter(Boolean).pop() || link;
    const pubDate = d?.[1] ? new Date(d[1]).toISOString() : "";
    const description = ((dsc?.[1] || dsc?.[2]) ?? "").trim().slice(0, 500);
    items.push({ title, slug, link, pubDate, description });
  }
  return items;
}

export async function GET() {
  try {
    const posts = await fetchRss();
    // Pair up Korean + English translations by title similarity.
    // Many Tiger Research posts have both KOR and ENG versions published within minutes.
    interface Research {
      id: string;              // normalized slug key
      titleKor?: string;
      titleEng?: string;
      slugKor?: string;
      slugEng?: string;
      linkKor?: string;
      linkEng?: string;
      pubDate: string;
      description: string;
    }

    const sorted = posts.slice().sort((a, b) => a.pubDate.localeCompare(b.pubDate));
    const researches: Research[] = [];
    const slugBase = (slug: string) => slug.replace(/-eng$|-kor$|-en$|-ko$/i, "");

    const byBase = new Map<string, Research>();
    for (const p of sorted) {
      const base = slugBase(p.slug);
      let r = byBase.get(base);
      if (!r) {
        r = { id: base, pubDate: p.pubDate, description: p.description };
        byBase.set(base, r);
        researches.push(r);
      }
      // Heuristic: title contains Korean char = KOR, otherwise ENG
      const isKor = /[가-힣]/.test(p.title);
      if (isKor) {
        r.titleKor = p.title;
        r.slugKor = p.slug;
        r.linkKor = p.link;
      } else {
        r.titleEng = p.title;
        r.slugEng = p.slug;
        r.linkEng = p.link;
      }
      // Keep the earliest pubDate as the research publication time
      if (!r.pubDate || p.pubDate < r.pubDate) r.pubDate = p.pubDate;
      if (!r.description && p.description) r.description = p.description;
    }

    // Sort by pubDate desc (newest first)
    researches.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

    return NextResponse.json({ researches });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list research" },
      { status: 500 },
    );
  }
}

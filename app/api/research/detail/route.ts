import { NextResponse } from "next/server";
import { getGoogleAuth } from "@/lib/google-auth";
import { google } from "googleapis";

interface GA4Row {
  pagePath: string;
  pageTitle?: string;
  sessions: number;
  pageviews: number;
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const STIBEE_TAB = "스티비";
const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";

// Fetch GA4 metrics for a specific pagePath pattern.
async function ga4ForPath(pathPattern: string, from: string, to: string) {
  if (!PROPERTY_ID) return null;
  const auth = getGoogleAuth();
  const data = google.analyticsdata({ version: "v1beta", auth });

  const totals = await data.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "CONTAINS", value: pathPattern },
        },
      },
      limit: "50",
    },
  });

  const sources = await data.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "CONTAINS", value: pathPattern },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "15",
    },
  });

  const countries = await data.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "CONTAINS", value: pathPattern },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "10",
    },
  });

  const pages: GA4Row[] = (totals.data.rows ?? []).map((r) => ({
    pagePath: r.dimensionValues?.[0]?.value ?? "",
    pageTitle: r.dimensionValues?.[1]?.value ?? "",
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
    pageviews: Number(r.metricValues?.[1]?.value ?? 0),
  }));

  const totalSessions = pages.reduce((s, r) => s + r.sessions, 0);
  const totalPageviews = pages.reduce((s, r) => s + r.pageviews, 0);

  return {
    totalSessions,
    totalPageviews,
    pages,
    sources: (sources.data.rows ?? []).map((r) => ({
      name: r.dimensionValues?.[0]?.value ?? "unknown",
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    countries: (countries.data.rows ?? []).map((r) => ({
      name: r.dimensionValues?.[0]?.value ?? "unknown",
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
  };
}

// Match Stibee campaign by publication date proximity (±3 days)
async function matchStibee(pubDateIso: string) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${STIBEE_TAB}'!A1:Z200`,
    });
    const rows = res.data.values ?? [];
    const pubTime = new Date(pubDateIso).getTime();
    const parseSheetDate = (s: string): number => {
      const parts = s.split("/").map(Number);
      if (parts.length !== 3) return NaN;
      const [y, m, d] = parts;
      return new Date(2000 + y, m - 1, d).getTime();
    };
    let best: { round: string; date: string; openRate: number | null; clickRate: number | null; sent: number | null; diffDays: number } | null = null;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;
      const date = (r[1] || "").trim();
      const t = parseSheetDate(date);
      if (isNaN(t)) continue;
      const diffDays = Math.abs(t - pubTime) / 86400000;
      if (diffDays > 7) continue; // only match within a week
      if (!best || diffDays < best.diffDays) {
        const parseRate = (s: string) => {
          const n = Number((s || "").replace("%", ""));
          return isNaN(n) ? null : n;
        };
        best = {
          round: (r[0] || "").trim(),
          date,
          openRate: parseRate(r[2]),
          clickRate: parseRate(r[3]),
          sent: Number((r[4] || "").replace(/,/g, "")) || null,
          diffDays,
        };
      }
    }
    return best;
  } catch {
    return null;
  }
}

// Fetch Telegram post views matched to publication window (±7 days)
async function matchTelegram(pubDateIso: string, baseUrl: string, title: string) {
  try {
    const res = await fetch(`${baseUrl}/api/telegram-posts`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { posts?: { date: string; title: string; views?: number }[] };
    const pubTime = new Date(pubDateIso).getTime();
    const near = (data.posts ?? []).filter((p) => {
      const t = new Date(p.date).getTime();
      return Math.abs(t - pubTime) <= 7 * 86400000;
    });
    // Rank by title keyword overlap
    const keywords = title
      .toLowerCase()
      .split(/[^a-z0-9가-힣]+/)
      .filter((w) => w.length > 2);
    const scored = near.map((p) => {
      const ptitle = (p.title || "").toLowerCase();
      const score = keywords.reduce((s, k) => (ptitle.includes(k) ? s + 1 : s), 0);
      return { ...p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const matched = scored.filter((p) => p.score > 0).slice(0, 5);
    const totalViews = matched.reduce((s, p) => s + (p.views ?? 0), 0);
    return { matched, totalViews };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const pubDate = url.searchParams.get("pubDate") || "";
  const title = url.searchParams.get("title") || "";
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  // Use the incoming request's origin so sibling API calls stay in-cluster
  const base = `${url.protocol}//${url.host}`;

  // Date window around publication (14 days after publication for GA4)
  const pubTime = pubDate ? new Date(pubDate) : new Date();
  const from = pubDate ? pubDate.split("T")[0] : new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const toDate = new Date(pubTime.getTime() + 30 * 86400000);
  const now = new Date();
  const to = (toDate < now ? toDate : now).toISOString().split("T")[0];

  const slugBase = slug.replace(/-eng$|-kor$/i, "");

  // Fetch X mapping first so we can issue tweet fetches in parallel
  async function fetchXMapping() {
    try {
      const r = await fetch(`${base}/api/research/x-mapping`, { next: { revalidate: 300 } });
      if (!r.ok) return null;
      const data = (await r.json()) as { mappings?: { slugBase: string; xUrlKor?: string; xUrlEng?: string }[] };
      return (data.mappings ?? []).find((m) => m.slugBase === slugBase) || null;
    } catch {
      return null;
    }
  }
  async function fetchTweet(xurl: string) {
    try {
      const r = await fetch(`${base}/api/x-tweet?url=${encodeURIComponent(xurl)}`, { next: { revalidate: 1800 } });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }
  async function fetchPrMatches() {
    try {
      const r = await fetch(
        `${base}/api/research/pr-match?title=${encodeURIComponent(title)}&pubDate=${encodeURIComponent(pubDate)}&windowDays=60`,
        { next: { revalidate: 1800 } },
      );
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }

  const xMap = await fetchXMapping();
  const [ga4, stibee, tg, prs, xKor, xEng] = await Promise.allSettled([
    ga4ForPath(`/p/${slugBase}`, from, to),
    matchStibee(pubDate),
    matchTelegram(pubDate, base, title),
    pubDate && title ? fetchPrMatches() : Promise.resolve(null),
    xMap?.xUrlKor ? fetchTweet(xMap.xUrlKor) : Promise.resolve(null),
    xMap?.xUrlEng ? fetchTweet(xMap.xUrlEng) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    slug,
    slugBase,
    pubDate,
    title,
    window: { from, to },
    ga4: ga4.status === "fulfilled" ? ga4.value : null,
    stibee: stibee.status === "fulfilled" ? stibee.value : null,
    telegram: tg.status === "fulfilled" ? tg.value : null,
    pr: prs.status === "fulfilled" ? prs.value : null,
    x: {
      kor: xKor.status === "fulfilled" ? xKor.value : null,
      eng: xEng.status === "fulfilled" ? xEng.value : null,
      mapping: xMap,
    },
  });
}

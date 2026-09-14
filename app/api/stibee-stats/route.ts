import { NextResponse } from "next/server";

const BASE = "https://api.stibee.com/v1";

interface Subscriber {
  email: string;
  name?: string;
  status?: string; // "S" = subscribed, others = unsubscribed / bounced
  createdTime?: string;
  modifiedTime?: string;
}

interface StibeeList {
  id: number;
  name: string;
  createdTime?: string;
}

async function getJSON<T>(url: string, token: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: { AccessToken: token },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function GET() {
  const token = process.env.STIBEE_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: "STIBEE_API_KEY not set" },
      { status: 500 },
    );
  }

  try {
    // 1. Get the list(s)
    const listsResp = await getJSON<{ Ok: boolean; Value: StibeeList[] }>(
      `${BASE}/lists`,
      token,
    );
    if (!listsResp?.Ok || !listsResp.Value?.length) {
      return NextResponse.json({ error: "No Stibee lists found" }, { status: 404 });
    }

    // Assume single primary list (the "기본 주소록")
    const list = listsResp.Value[0];

    // 2. Paginate through subscribers to get accurate counts.
    // Stibee's max limit per page is ~1000.
    const allSubs: Subscriber[] = [];
    const PAGE = 1000;
    let offset = 0;
    while (true) {
      const page = await getJSON<{ Ok: boolean; Value: Subscriber[] }>(
        `${BASE}/lists/${list.id}/subscribers?offset=${offset}&limit=${PAGE}`,
        token,
      );
      const rows = page?.Value ?? [];
      allSubs.push(...rows);
      if (rows.length < PAGE) break;
      offset += PAGE;
      if (offset > 100_000) break; // safety
    }

    const active = allSubs.filter((s) => s.status === "S").length;
    const total = allSubs.length;
    const inactive = total - active;

    // Subscribers gained in last 7 / 30 days (by createdTime)
    const now = Date.now();
    const parseDate = (s?: string) => (s ? Date.parse(s.replace(" KST", "").replace(/ \+\d{4}/, "")) : NaN);
    const gained7d = allSubs.filter((s) => {
      const t = parseDate(s.createdTime);
      return !isNaN(t) && now - t <= 7 * 86400000;
    }).length;
    const gained30d = allSubs.filter((s) => {
      const t = parseDate(s.createdTime);
      return !isNaN(t) && now - t <= 30 * 86400000;
    }).length;

    return NextResponse.json({
      list: { id: list.id, name: list.name },
      total,
      active,
      inactive,
      gained7d,
      gained30d,
      // Open/click rate: Stibee's public API doesn't expose campaign statistics.
      // Left as null so the dashboard can display a placeholder.
      avgOpenRate: null,
      avgClickRate: null,
      recentCampaigns: [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch Stibee stats" },
      { status: 500 },
    );
  }
}

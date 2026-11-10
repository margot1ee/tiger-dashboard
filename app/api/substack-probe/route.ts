import { NextResponse } from "next/server";

const BASE = "https://reports.tiger-research.com/api/v1";

function getHeaders() {
  const sid = process.env.SUBSTACK_SID;
  const storageKey = process.env.SUBSTACK_COOKIE_STORAGE_KEY;
  if (!sid) throw new Error("SUBSTACK_SID not set");
  return {
    Cookie: `connect.sid=${sid}${storageKey ? `; cookie_storage_key=${storageKey}` : ""}`,
    "User-Agent": "Mozilla/5.0",
    Referer: "https://reports.tiger-research.com/publish/subscribers",
    Accept: "application/json",
  };
}

export async function GET() {
  const paths = [
    "/publish-dashboard/subscribers?limit=3",
    "/publish-dashboard/subscribers/export?limit=3",
    "/publish-dashboard/subscribers/stats",
    "/publish-dashboard/subscribers/timeseries",
    "/publish-dashboard/stats/subscribers",
    "/publish-dashboard/subscribers/history",
    "/publish-dashboard/subscribers-stats",
    "/publication/subscriber-stats",
    "/publish/subscribers/stats",
    "/dashboard/subscribers",
    "/publish-dashboard/summary-v2?range=7",
    "/publish-dashboard/subscribers/counts",
    "/publish-dashboard/subscribers/graph",
  ];
  const headers = getHeaders();
  const results: Record<string, { status: number; preview: string }> = {};
  for (const p of paths) {
    try {
      const r = await fetch(`${BASE}${p}`, { headers, cache: "no-store" });
      const text = await r.text();
      results[p] = {
        status: r.status,
        preview: text.slice(0, 300),
      };
    } catch (e) {
      results[p] = { status: 0, preview: String(e).slice(0, 200) };
    }
  }
  return NextResponse.json(results);
}

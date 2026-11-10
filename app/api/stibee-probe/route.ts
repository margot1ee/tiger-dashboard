import { NextResponse } from "next/server";

const BASE = "https://api.stibee.com/v1";

// Probe Stibee API endpoints to find campaign/link-click data
export async function GET() {
  const token = process.env.STIBEE_API_KEY;
  if (!token) return NextResponse.json({ error: "no key" }, { status: 500 });

  const paths = [
    "/campaigns",
    "/campaigns?limit=5",
    "/lists",
    "/campaigns/stats",
    "/reports",
    "/reports/campaigns",
    "/reports/clicks",
    "/reports/opens",
    "/campaigns/links",
    "/campaigns/urls",
  ];
  const results: Record<string, { status: number; preview: string }> = {};
  for (const p of paths) {
    try {
      const r = await fetch(`${BASE}${p}`, { headers: { AccessToken: token } });
      const t = await r.text();
      results[p] = { status: r.status, preview: t.slice(0, 500) };
    } catch (e) {
      results[p] = { status: 0, preview: String(e).slice(0, 200) };
    }
  }
  return NextResponse.json(results);
}

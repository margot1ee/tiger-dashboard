import { NextResponse } from "next/server";

const BASE_URL = "https://reports.tiger-research.com/api/v1/publish-dashboard";

function getHeaders() {
  const sid = process.env.SUBSTACK_SID;
  const storageKey = process.env.SUBSTACK_COOKIE_STORAGE_KEY;
  if (!sid) throw new Error("SUBSTACK_SID not set");
  return {
    Cookie: `connect.sid=${sid}${storageKey ? `; cookie_storage_key=${storageKey}` : ""}`,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Referer: "https://reports.tiger-research.com/publish/home",
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "/published?offset=0&limit=10";
    const headers = getHeaders();
    const url = `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }
    return NextResponse.json({
      url,
      status: res.status,
      contentType: res.headers.get("content-type"),
      // Trim to keep response small
      bodyPreview: text.slice(0, 4000),
      keys: parsed && typeof parsed === "object" ? Object.keys(parsed as Record<string, unknown>) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

const BASE_URL = "https://reports.tiger-research.com/api/v1/publish-dashboard";

function getHeaders() {
  const sid = process.env.SUBSTACK_SID;
  const storageKey = process.env.SUBSTACK_COOKIE_STORAGE_KEY;
  if (!sid) throw new Error("SUBSTACK_SID not set");
  return {
    Cookie: `connect.sid=${sid}${storageKey ? `; cookie_storage_key=${storageKey}` : ""}`,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Referer: "https://reports.tiger-research.com/publish/home",
  };
}

interface RawSubscriber {
  total_count: number;
  subscription_created_at: string;
  is_subscribed: boolean;
}

export async function GET(request: Request) {
  try {
    const headers = getHeaders();
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") || "7");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString();

    // Fetch recent subscribers (sorted by created_at desc)
    // We fetch enough to cover the period
    const limit = Math.min(days * 50, 500); // estimate ~50 subs/day max
    const res = await fetch(
      `${BASE_URL}/subscribers?offset=0&limit=${limit}&order_by=subscription_created_at&order_direction=desc`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Substack auth failed. Cookie may have expired." },
        { status: 401 }
      );
    }

    const data = await res.json();
    const totalSubscribers = data.count ?? data.chartCounts?.totalEmail ?? 0;
    const subscribers: RawSubscriber[] = data.subscribers ?? [];

    // Count gained (created within period, currently subscribed)
    // Count lost (created within period, NOT currently subscribed — they signed up and left)
    let gained = 0;
    let lost = 0;

    for (const sub of subscribers) {
      if (sub.subscription_created_at >= cutoffStr) {
        if (sub.is_subscribed) {
          gained++;
        } else {
          lost++;
        }
      }
    }

    // Also fetch recently unsubscribed to get accurate "lost" count
    // is_subscribed=false in the main list means they were never active subscribers
    // We need a different approach: fetch with filter
    const inactiveRes = await fetch(
      `${BASE_URL}/subscribers?offset=0&limit=${limit}&order_by=subscription_created_at&order_direction=desc&filter=inactive`,
      { headers, next: { revalidate: 3600 } }
    );

    let recentlyLost = 0;
    if (inactiveRes.ok) {
      const inactiveData = await inactiveRes.json();
      const inactiveSubs: RawSubscriber[] = inactiveData.subscribers ?? [];
      for (const sub of inactiveSubs) {
        if (sub.subscription_created_at >= cutoffStr) {
          recentlyLost++;
        }
      }
    }

    // Use the larger of the two lost counts
    const totalLost = Math.max(lost, recentlyLost);
    const netChange = gained - totalLost;

    return NextResponse.json({
      totalSubscribers,
      gained,
      lost: totalLost,
      netChange,
      days,
      cutoffDate: cutoff.toISOString().split("T")[0],
    });
  } catch (e) {
    console.error("Substack subscribers error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

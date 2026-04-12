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
    const headers = getHeaders();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // days: 7, 30, 90, 365

    // Fetch summary-v2 with range parameter (views by period)
    const summaryV2Res = await fetch(`${BASE_URL}/summary-v2?range=${range}`, {
      headers,
      next: { revalidate: 3600 },
    });

    // Fetch summary (subscribers, open rate - always current)
    const summaryRes = await fetch(`${BASE_URL}/summary`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!summaryRes.ok) {
      return NextResponse.json(
        { error: "Substack auth failed. Cookie may have expired." },
        { status: 401 }
      );
    }

    const summary = await summaryRes.json();

    let periodViews = summary.views ?? 0;
    let prevPeriodViews = 0;
    let periodSubscribersStart = 0;
    let periodSubscribersEnd = summary.totalEmail ?? 0;
    let viewsChangePercent = 0;

    if (summaryV2Res.ok) {
      const v2 = await summaryV2Res.json();
      // End = current period, Start = previous same-length period
      periodViews = v2.totalViewsEnd ?? 0;
      prevPeriodViews = v2.totalViewsStart ?? 0;
      periodSubscribersStart = v2.totalSubscribersStart ?? 0;
      periodSubscribersEnd = v2.totalSubscribersEnd ?? summary.totalEmail ?? 0;
      if (prevPeriodViews > 0) {
        viewsChangePercent = Math.round(((periodViews - prevPeriodViews) / prevPeriodViews) * 1000) / 10;
      }
    }

    // Fetch recent posts with stats (up to 50 for subscriber gain/loss calculation)
    const postsRes = await fetch(
      `${BASE_URL}/published?offset=0&limit=50&order_by=post_date&order_direction=desc`,
      { headers, next: { revalidate: 3600 } }
    );

    interface RawPost {
      title: string;
      slug: string;
      post_date: string;
      stats?: {
        views?: number;
        open_rate?: number;
        click_through_rate?: number;
        signups_within_1_day?: number;
        disables_within_1_day?: number;
      };
      reaction_count?: number;
    }

    let posts: {
      title: string;
      slug: string;
      postDate: string;
      views: number;
      openRate: number;
      clickRate: number;
      reactions: number;
    }[] = [];

    let subsGained = 0;
    let subsLost = 0;

    if (postsRes.ok) {
      const postsData = await postsRes.json();
      const rangeDays = Number(range);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rangeDays);
      const cutoffStr = cutoffDate.toISOString();

      const allPosts: RawPost[] = postsData.posts || [];

      // Filter posts within the selected period for subscriber gain/loss
      for (const p of allPosts) {
        if (p.post_date >= cutoffStr) {
          subsGained += p.stats?.signups_within_1_day ?? 0;
          subsLost += p.stats?.disables_within_1_day ?? 0;
        }
      }

      posts = allPosts.slice(0, 10).map((p: RawPost) => ({
        title: p.title,
        slug: p.slug,
        postDate: p.post_date,
        views: p.stats?.views ?? 0,
        openRate: Math.round((p.stats?.open_rate ?? 0) * 10000) / 100,
        clickRate:
          Math.round((p.stats?.click_through_rate ?? 0) * 10000) / 100,
        reactions: p.reaction_count ?? 0,
      }));
    }

    return NextResponse.json({
      subscribers: periodSubscribersEnd,
      subscribersStart: periodSubscribersStart,
      subscribersChange: periodSubscribersEnd - periodSubscribersStart,
      subsGained,
      subsLost,
      paidSubscribers: summary.subscribers ?? 0,
      appSubscribers: summary.appSubscribers ?? 0,
      views: periodViews,
      prevViews: prevPeriodViews,
      viewsChangePercent,
      openRate: Math.round((summary.openRate ?? 0) * 100) / 100,
      openRateDiff: Math.round((summary.openRateDiff ?? 0) * 100) / 100,
      range: Number(range),
      posts,
    });
  } catch (e) {
    console.error("Substack stats error:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to fetch Substack stats",
      },
      { status: 500 }
    );
  }
}

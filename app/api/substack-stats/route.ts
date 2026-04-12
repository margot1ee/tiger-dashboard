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

export async function GET() {
  try {
    const headers = getHeaders();

    // Fetch summary (subscribers, views, open rate)
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

    // Fetch recent posts with stats
    const postsRes = await fetch(
      `${BASE_URL}/published?offset=0&limit=10&order_by=post_date&order_direction=desc`,
      { headers, next: { revalidate: 3600 } }
    );

    let posts: {
      title: string;
      slug: string;
      postDate: string;
      views: number;
      openRate: number;
      clickRate: number;
      reactions: number;
    }[] = [];

    if (postsRes.ok) {
      const postsData = await postsRes.json();
      posts = (postsData.posts || []).map(
        (p: {
          title: string;
          slug: string;
          post_date: string;
          stats?: {
            views?: number;
            open_rate?: number;
            click_through_rate?: number;
          };
          reaction_count?: number;
        }) => ({
          title: p.title,
          slug: p.slug,
          postDate: p.post_date,
          views: p.stats?.views ?? 0,
          openRate: Math.round((p.stats?.open_rate ?? 0) * 10000) / 100,
          clickRate:
            Math.round((p.stats?.click_through_rate ?? 0) * 10000) / 100,
          reactions: p.reaction_count ?? 0,
        })
      );
    }

    return NextResponse.json({
      subscribers: summary.totalEmail ?? 0,
      paidSubscribers: summary.subscribers ?? 0,
      appSubscribers: summary.appSubscribers ?? 0,
      views: summary.views ?? 0,
      viewsDelta: summary.viewsDelta ?? 0,
      openRate: Math.round((summary.openRate ?? 0) * 100) / 100,
      openRateDiff: Math.round((summary.openRateDiff ?? 0) * 100) / 100,
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

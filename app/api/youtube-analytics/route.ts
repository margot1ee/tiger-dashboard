import { NextResponse } from "next/server";

async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("YouTube OAuth credentials not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to refresh YouTube token");
  return data.access_token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    // Prefer explicit Tiger Research channel ID from env; fall back to
    // "MINE" (the OAuth-authenticated user's primary channel).
    const channelId = process.env.YOUTUBE_CHANNEL_ID || "MINE";

    // YouTube Studio's "Last N days" / "This week" view typically includes today.
    // Use a rolling N-day window ending today (inclusive) to match Studio.
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1)); // inclusive N-day window

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - (days - 1));

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const accessToken = await getAccessToken();

    const headers = { Authorization: `Bearer ${accessToken}` };
    const metrics = "views,subscribersGained,subscribersLost,estimatedMinutesWatched";

    // Current period
    const currentRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${fmt(startDate)}&endDate=${fmt(endDate)}&metrics=${metrics}`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!currentRes.ok) {
      const err = await currentRes.text();
      return NextResponse.json({ error: `YouTube Analytics error: ${err}` }, { status: currentRes.status });
    }

    const currentData = await currentRes.json();

    // Previous period
    const prevRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${fmt(prevStartDate)}&endDate=${fmt(prevEndDate)}&metrics=${metrics}`,
      { headers, next: { revalidate: 3600 } }
    );

    const prevData = prevRes.ok ? await prevRes.json() : null;

    const row = currentData.rows?.[0] || [0, 0, 0, 0];
    const prevRow = prevData?.rows?.[0] || [0, 0, 0, 0];

    const views = row[0] ?? 0;
    const subsGained = row[1] ?? 0;
    const subsLost = row[2] ?? 0;
    const watchMinutes = row[3] ?? 0;

    const prevViews = prevRow[0] ?? 0;
    const prevSubsGained = prevRow[1] ?? 0;
    const prevSubsLost = prevRow[2] ?? 0;

    const viewsChange = prevViews > 0 ? Math.round(((views - prevViews) / prevViews) * 1000) / 10 : 0;

    return NextResponse.json({
      views,
      prevViews,
      viewsChangePercent: viewsChange,
      subscribersGained: subsGained,
      subscribersLost: subsLost,
      netSubscribers: subsGained - subsLost,
      prevNetSubscribers: prevSubsGained - prevSubsLost,
      watchMinutes: Math.round(watchMinutes),
      days,
      period: `${fmt(startDate)} ~ ${fmt(endDate)}`,
    });
  } catch (e) {
    console.error("YouTube Analytics error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch YouTube Analytics" },
      { status: 500 }
    );
  }
}

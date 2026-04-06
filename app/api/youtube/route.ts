import { NextRequest, NextResponse } from "next/server";

function parseISO8601Duration(iso: string): number {
  // PT1H2M3S → seconds
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json(
      { error: "YouTube API key or Channel ID not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const maxResults = Math.min(parseInt(searchParams.get("maxResults") || "50"), 50);

  try {
    // Channel statistics
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const stats = channelData.items[0].statistics;
    const snippet = channelData.items[0].snippet;

    // Recent videos (fetch up to maxResults)
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${maxResults}&type=video&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const videosData = await videosRes.json();

    // Get video stats + contentDetails for each video
    const videoIds = videosData.items?.map((v: { id: { videoId: string } }) => v.id.videoId).join(",") || "";
    let videoDetails: Record<string, {
      viewCount: string;
      likeCount: string;
      commentCount: string;
      duration: string;
      durationSeconds: number;
      formattedDuration: string;
    }> = {};

    if (videoIds) {
      const videoStatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      const videoStatsData = await videoStatsRes.json();
      videoDetails = Object.fromEntries(
        videoStatsData.items?.map((v: {
          id: string;
          statistics: { viewCount: string; likeCount: string; commentCount: string };
          contentDetails: { duration: string };
        }) => {
          const durationSeconds = parseISO8601Duration(v.contentDetails.duration);
          return [v.id, {
            viewCount: v.statistics.viewCount,
            likeCount: v.statistics.likeCount,
            commentCount: v.statistics.commentCount,
            duration: v.contentDetails.duration,
            durationSeconds,
            formattedDuration: formatDuration(durationSeconds),
          }];
        }) || []
      );
    }

    const videos = videosData.items?.map((v: { id: { videoId: string }; snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } } }) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.medium?.url || null,
      views: Number(videoDetails[v.id.videoId]?.viewCount || 0),
      likes: Number(videoDetails[v.id.videoId]?.likeCount || 0),
      comments: Number(videoDetails[v.id.videoId]?.commentCount || 0),
      durationSeconds: videoDetails[v.id.videoId]?.durationSeconds || 0,
      formattedDuration: videoDetails[v.id.videoId]?.formattedDuration || "0:00",
    })) || [];

    // Calculate summary stats
    const totalViews = videos.reduce((sum: number, v: { views: number }) => sum + v.views, 0);
    const avgDurationSeconds = videos.length > 0
      ? Math.round(videos.reduce((sum: number, v: { durationSeconds: number }) => sum + v.durationSeconds, 0) / videos.length)
      : 0;

    return NextResponse.json({
      channel: {
        title: snippet.title,
        subscribers: Number(stats.subscriberCount),
        totalViews: Number(stats.viewCount),
        videoCount: Number(stats.videoCount),
      },
      videos,
      summary: {
        totalViewsInList: totalViews,
        avgDurationSeconds,
        avgDurationFormatted: formatDuration(avgDurationSeconds),
        videoCount: videos.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch YouTube data" },
      { status: 500 }
    );
  }
}

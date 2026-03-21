import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json(
      { error: "YouTube API key or Channel ID not configured" },
      { status: 500 }
    );
  }

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

    // Recent videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const videosData = await videosRes.json();

    // Get video stats for each video
    const videoIds = videosData.items?.map((v: { id: { videoId: string } }) => v.id.videoId).join(",") || "";
    let videoStats: Record<string, { viewCount: string; likeCount: string; commentCount: string }> = {};

    if (videoIds) {
      const videoStatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      const videoStatsData = await videoStatsRes.json();
      videoStats = Object.fromEntries(
        videoStatsData.items?.map((v: { id: string; statistics: { viewCount: string; likeCount: string; commentCount: string } }) => [v.id, v.statistics]) || []
      );
    }

    const videos = videosData.items?.map((v: { id: { videoId: string }; snippet: { title: string; publishedAt: string } }) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      views: Number(videoStats[v.id.videoId]?.viewCount || 0),
      likes: Number(videoStats[v.id.videoId]?.likeCount || 0),
      comments: Number(videoStats[v.id.videoId]?.commentCount || 0),
    })) || [];

    return NextResponse.json({
      channel: {
        title: snippet.title,
        subscribers: Number(stats.subscriberCount),
        totalViews: Number(stats.viewCount),
        videoCount: Number(stats.videoCount),
      },
      videos,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch YouTube data" },
      { status: 500 }
    );
  }
}

"use client";

import { use } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { channelMetrics } from "@/lib/demo-data";
import { useYouTubeData, useSubstackData } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, Heart, MessageCircle, Loader2 } from "lucide-react";

const channelUrls: Record<string, string> = {
  substack: "https://reports.tiger-research.com/",
  x: "https://x.com/Tiger_Research_",
  linkedin: "https://www.linkedin.com/company/tiger-research-inc/",
  youtube: "https://www.youtube.com/@Tiger_Research",
  telegram: "https://t.me/tiger_research",
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateChannelTrend(channel: string) {
  const base = channelMetrics[channel as keyof typeof channelMetrics]?.followers ?? 1000;
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(2026, 2, 21), 29 - i), "MM/dd"),
    followers: Math.floor(base - (29 - i) * (base * 0.001) + seededRandom(i + 50) * base * 0.005),
    engagements: Math.floor(seededRandom(i + 80) * 500 + 100),
  }));
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function YouTubeDetail() {
  const { data, loading, error } = useYouTubeData();

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading YouTube data...</div>;
  if (error || !data) return <p className="text-sm text-muted-foreground">YouTube API not connected. Add YOUTUBE_API_KEY to Vercel env vars.</p>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Subscribers" value={data.channel.subscribers.toLocaleString()} icon={<Badge className="bg-red-100 text-red-700 text-[10px]">LIVE</Badge>} />
        <MetricCard title="Total Views" value={formatNumber(data.channel.totalViews)} />
        <MetricCard title="Videos" value={data.channel.videoCount.toString()} />
        <MetricCard title="Avg. Views/Video" value={formatNumber(Math.round(data.channel.totalViews / data.channel.videoCount))} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right"><Eye className="h-3.5 w-3.5 inline mr-1" />Views</TableHead>
                <TableHead className="text-right"><Heart className="h-3.5 w-3.5 inline mr-1" />Likes</TableHead>
                <TableHead className="text-right"><MessageCircle className="h-3.5 w-3.5 inline mr-1" />Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium max-w-[300px]">
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                      {video.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">{video.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{video.likes.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{video.comments.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function SubstackDetail() {
  const { data, loading, error } = useSubstackData();

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading Substack data...</div>;
  if (error || !data) return <p className="text-sm text-muted-foreground">Failed to load Substack RSS.</p>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Subscribers" value="22,340" changeLabel="Manual input" />
        <MetricCard title="Recent Posts" value={data.totalPosts.toString()} icon={<Badge className="bg-orange-100 text-orange-700 text-[10px]">RSS</Badge>} />
        <MetricCard title="Open Rate" value="42%" change={1.2} changeLabel="WoW" />
        <MetricCard title="Avg. Read Time" value="4:12" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.posts.slice(0, 10).map((post, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
                <div className="min-w-0">
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-orange-500 transition-colors">
                    {post.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {post.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(post.pubDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DefaultDetail({ channel, metrics }: { channel: string; metrics: { name: string; followers: number; change: number; color: string } }) {
  const trend = generateChannelTrend(channel);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Followers" value={metrics.followers.toLocaleString()} change={metrics.change} changeLabel="WoW" />
        <MetricCard title="Weekly Growth" value={`+${Math.floor(metrics.followers * metrics.change / 100)}`} change={metrics.change} />
        <MetricCard title="Engagement Rate" value="4.2%" change={0.8} changeLabel="WoW" />
        <MetricCard title="Avg. Impressions" value="12.5K" change={3.4} changeLabel="WoW" />
      </div>

      <TrendChart
        title={`${metrics.name} Followers (Last 30 Days)`}
        data={trend}
        lines={[{ dataKey: "followers", color: metrics.color, name: "Followers" }]}
        height={350}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This channel requires manual data input. Go to <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link> to add weekly stats.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export default function ChannelDetailPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = use(params);
  const metrics = channelMetrics[channel as keyof typeof channelMetrics];

  if (!metrics) {
    return (
      <div className="space-y-4">
        <Link href="/channels" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Channels
        </Link>
        <p>Channel not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/channels" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Channels
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {metrics.name}
          {channelUrls[channel] && (
            <a
              href={channelUrls[channel]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-orange-500 transition-colors"
              title={`Open ${metrics.name}`}
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed analytics for {metrics.name}
        </p>
      </div>

      {channel === "youtube" && <YouTubeDetail />}
      {channel === "substack" && <SubstackDetail />}
      {channel !== "youtube" && channel !== "substack" && (
        <DefaultDetail channel={channel} metrics={metrics} />
      )}
    </div>
  );
}

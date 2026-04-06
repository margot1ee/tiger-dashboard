"use client";

import { use, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { channelMetrics } from "@/lib/demo-data";
import { useYouTubeData, useSubstackData, useTelegramData, useChannelMetricsByChannel } from "@/lib/hooks";
import type { YouTubeVideo } from "@/lib/hooks";
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
import { ArrowLeft, ExternalLink, Eye, Heart, MessageCircle, Loader2, Repeat2, Quote, Clock, TrendingUp, TrendingDown, Play, BarChart3, Timer } from "lucide-react";

const channelUrls: Record<string, string> = {
  substack: "https://reports.tiger-research.com/",
  x: "https://x.com/Tiger_Research_",
  linkedin: "https://www.linkedin.com/company/tiger-research-inc/",
  youtube: "https://www.youtube.com/@Tiger_Research",
  telegram: "https://t.me/tiger_research",
  xiaohongshu: "https://www.xiaohongshu.com/user/profile/95032606859",
  instagram_id: "https://www.instagram.com/tigerresearch_",
  x_jp: "https://x.com/tr_japan_",
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

type YTPeriod = "7d" | "4w" | "3m" | "6m" | "1y" | "all";

function getPeriodDays(period: YTPeriod): number | null {
  switch (period) {
    case "7d": return 7;
    case "4w": return 28;
    case "3m": return 90;
    case "6m": return 180;
    case "1y": return 365;
    case "all": return null;
  }
}

function getPeriodLabel(period: YTPeriod): string {
  switch (period) {
    case "7d": return "7일";
    case "4w": return "4주";
    case "3m": return "3개월";
    case "6m": return "6개월";
    case "1y": return "1년";
    case "all": return "전체";
  }
}

function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function filterVideosByPeriod(videos: YouTubeVideo[], period: YTPeriod): YouTubeVideo[] {
  const days = getPeriodDays(period);
  if (days === null) return videos;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return videos.filter(v => new Date(v.publishedAt) >= cutoff);
}

function getVideosPublishedWithin24h(videos: YouTubeVideo[]): YouTubeVideo[] {
  // Videos published within the last 24 hours of their publish date
  // We show views accumulated by day 1 (approximation: for recently published videos)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return videos.filter(v => new Date(v.publishedAt) >= oneDayAgo);
}

function YouTubeDetail() {
  const { data, loading, error } = useYouTubeData();
  const [period, setPeriod] = useState<YTPeriod>("7d");

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading YouTube data...</div>;
  if (error || !data) return <p className="text-sm text-muted-foreground">YouTube API not connected. Add YOUTUBE_API_KEY to Vercel env vars.</p>;

  const periodDays = getPeriodDays(period);
  const periodVideos = filterVideosByPeriod(data.videos, period);
  const periodViews = periodVideos.reduce((sum, v) => sum + v.views, 0);
  const totalViews = data.videos.reduce((sum, v) => sum + v.views, 0);

  // WoW: compare period views vs previous period views
  const prevPeriodVideos = periodDays
    ? data.videos.filter(v => {
        const pub = new Date(v.publishedAt);
        const now = new Date();
        const periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - periodDays);
        const prevStart = new Date(periodStart);
        prevStart.setDate(prevStart.getDate() - periodDays);
        return pub >= prevStart && pub < periodStart;
      })
    : [];
  const prevPeriodViews = prevPeriodVideos.reduce((sum, v) => sum + v.views, 0);
  const wow = prevPeriodViews > 0
    ? Math.round(((periodViews - prevPeriodViews) / prevPeriodViews) * 1000) / 10
    : null;

  // Average duration
  const avgDuration = data.videos.length > 0
    ? Math.round(data.videos.reduce((sum, v) => sum + v.durationSeconds, 0) / data.videos.length)
    : 0;

  // Sort videos by views (descending) for the table
  const sortedByViews = [...data.videos].sort((a, b) => b.views - a.views);
  const periodSortedByViews = [...periodVideos].sort((a, b) => b.views - a.views);

  // Recently published videos (within 1 day) for "1일 경과시 조회수"
  const recentVideos = data.videos.filter(v => {
    const pub = new Date(v.publishedAt);
    const now = new Date();
    const diffHours = (now.getTime() - pub.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48; // within 48 hours
  });

  const periods: YTPeriod[] = ["7d", "4w", "3m", "6m", "1y", "all"];

  return (
    <>
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === p
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "7d" ? "7D" : p === "4w" ? "4W" : p === "3m" ? "3M" : p === "6m" ? "6M" : p === "1y" ? "1Y" : "All"}
          </button>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Subscribers"
          value={data.channel.subscribers.toLocaleString()}
          icon={<Badge className="bg-red-100 text-red-700 text-[10px]">LIVE</Badge>}
        />
        <MetricCard
          title={`조회수 (${getPeriodLabel(period)})`}
          value={formatNumber(periodViews)}
          change={wow ?? undefined}
          changeLabel="WoW"
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="총 조회수"
          value={formatNumber(data.channel.totalViews)}
        />
        <MetricCard
          title={`콘텐츠 (${getPeriodLabel(period)})`}
          value={`${periodVideos.length}개`}
          icon={<Play className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="평균 영상 길이"
          value={formatDurationShort(avgDuration)}
          icon={<Timer className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* 콘텐츠별 총 조회수 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            콘텐츠별 총 조회수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>게시일</TableHead>
                <TableHead className="text-right">조회수</TableHead>
                <TableHead className="text-right">좋아요</TableHead>
                <TableHead className="text-right">댓글</TableHead>
                <TableHead className="text-right">영상 길이</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByViews.map((video, i) => (
                <TableRow key={video.id}>
                  <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium max-w-[300px]">
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors line-clamp-1">
                      {video.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(video.publishedAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right font-medium">{video.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{video.likes.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{video.comments.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{video.formattedDuration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 설정 기간 동안의 콘텐츠별 조회수 */}
      {periodVideos.length > 0 && period !== "all" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {getPeriodLabel(period)} 동안 게시된 콘텐츠 조회수
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              최근 {getPeriodLabel(period)} 내 게시된 영상 {periodVideos.length}개
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>게시일</TableHead>
                  <TableHead className="text-right">조회수</TableHead>
                  <TableHead className="text-right">좋아요</TableHead>
                  <TableHead className="text-right">영상 길이</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodSortedByViews.map((video, i) => (
                  <TableRow key={video.id}>
                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium max-w-[300px]">
                      <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors line-clamp-1">
                        {video.title}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(video.publishedAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right font-medium">{video.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{video.likes.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{video.formattedDuration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 최근 게시 콘텐츠 (1일 경과시 조회수) */}
      {recentVideos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              1일 경과시 조회수 (최근 48시간 내 게시)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              게시 후 초기 조회 성과를 확인합니다
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>게시 시간</TableHead>
                  <TableHead className="text-right">경과 시간</TableHead>
                  <TableHead className="text-right">현재 조회수</TableHead>
                  <TableHead className="text-right">좋아요</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVideos.map((video) => {
                  const hoursAgo = Math.round((Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60));
                  return (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium max-w-[300px]">
                        <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors line-clamp-1">
                          {video.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(video.publishedAt).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <Badge variant="outline" className="text-[10px]">{hoursAgo}시간 전</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{video.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{video.likes.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 콘텐츠별 평균 시청 지속 시간 (영상 길이 기준) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Timer className="h-4 w-4" />
            콘텐츠별 영상 길이
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            평균 영상 길이: {formatDurationShort(avgDuration)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...data.videos].sort((a, b) => b.durationSeconds - a.durationSeconds).map((video) => {
              const maxDuration = Math.max(...data.videos.map(v => v.durationSeconds));
              const pct = maxDuration > 0 ? (video.durationSeconds / maxDuration) * 100 : 0;
              return (
                <div key={video.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-orange-500 transition-colors line-clamp-1">
                      {video.title}
                    </a>
                  </div>
                  <div className="w-[200px] flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-[50px] text-right">{video.formattedDuration}</span>
                  </div>
                </div>
              );
            })}
          </div>
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

function TelegramDetail() {
  const { data, loading, error } = useTelegramData();

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading Telegram data...</div>;
  if (error || !data) return <p className="text-sm text-muted-foreground">Telegram Bot not connected. Add TELEGRAM_BOT_TOKEN to Vercel env vars.</p>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Members" value={data.channel.members.toLocaleString()} icon={<Badge className="bg-blue-100 text-blue-700 text-[10px]">LIVE</Badge>} />
        <MetricCard title="Channel Type" value={data.channel.type === "channel" ? "Channel" : "Group"} />
        <MetricCard title="Username" value={`@${data.channel.username}`} />
        <MetricCard title="Status" value="Connected" icon={<Badge className="bg-green-100 text-green-700 text-[10px]">Active</Badge>} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Channel Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Title</span>
              <span className="font-medium">{data.channel.title}</span>
            </div>
            {data.channel.description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium max-w-[300px] text-right">{data.channel.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Link</span>
              <a href={`https://t.me/${data.channel.username}`} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-500 hover:underline">
                t.me/{data.channel.username}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function XDetail() {
  const { data: dbData } = useChannelMetricsByChannel("x");

  // Static fallback
  const xProfile = {
    name: "Tiger Research",
    username: "tiger_research",
    description: "Tiger Research is a leading Web3 market research and consulting firm specializing in the Asian market.",
    followers: 9293,
    following: 98,
    posts: 2810,
  };

  // Override with DB data (manual > auto)
  const latestDb = dbData?.metrics?.[0];
  const followers = latestDb?.followers ?? xProfile.followers;
  const impressions = latestDb?.impressions;
  const engagements = latestDb?.engagements;
  const engagementRate = latestDb?.engagement_rate;
  const dataSource = latestDb?.source;
  const dataDate = latestDb?.date;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={followers.toLocaleString()}
          icon={
            dataSource === "manual"
              ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge>
              : <Badge className="bg-gray-100 text-gray-700 text-[10px]">{dataDate ? new Date(dataDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Mar 22"}</Badge>
          }
        />
        <MetricCard title="Following" value={xProfile.following.toLocaleString()} />
        <MetricCard title="Posts" value={xProfile.posts.toLocaleString()} />
        {impressions != null ? (
          <MetricCard title="Impressions" value={formatNumber(impressions)} icon={dataSource === "manual" ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge> : undefined} />
        ) : (
          <MetricCard title="Account" value={`@${xProfile.username}`} />
        )}
      </div>

      {(engagements != null || engagementRate != null) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {engagements != null && <MetricCard title="Engagements" value={formatNumber(engagements)} />}
          {engagementRate != null && <MetricCard title="Engagement Rate" value={`${engagementRate}%`} />}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Account Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{xProfile.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bio</span>
              <span className="font-medium max-w-[400px] text-right">{xProfile.description}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Link</span>
              <a href={`https://x.com/${xProfile.username}`} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-500 hover:underline">
                x.com/{xProfile.username}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Data Source</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {latestDb
              ? `Data from Supabase (${dataSource}, updated ${dataDate}). `
              : "X API 무료 플랜이 폐지되어 수동 업데이트 방식으로 운영합니다. 최근 업데이트: 2026년 3월 22일. "}
            Engagement 데이터(Impressions, Likes 등)는{" "}
            <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link> 페이지에서 입력할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function LinkedInDetail({ metrics }: { metrics: { name: string; followers: number; change: number; color: string } }) {
  const { data: dbData } = useChannelMetricsByChannel("linkedin");
  const trend = generateChannelTrend("linkedin");

  const latestDb = dbData?.metrics?.[0];
  const followers = latestDb?.followers ?? metrics.followers;
  const impressions = latestDb?.impressions;
  const engagements = latestDb?.engagements;
  const dataSource = latestDb?.source;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={followers.toLocaleString()}
          change={metrics.change}
          changeLabel="WoW"
          icon={dataSource === "manual" ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge> : undefined}
        />
        <MetricCard title="Weekly Growth" value={`+${Math.floor(followers * metrics.change / 100)}`} change={metrics.change} />
        {impressions != null ? (
          <MetricCard title="Impressions" value={formatNumber(impressions)} />
        ) : (
          <MetricCard title="Avg. Impressions" value="8.5K" change={3.4} changeLabel="WoW" />
        )}
        {engagements != null ? (
          <MetricCard title="Engagements" value={formatNumber(engagements)} />
        ) : (
          <MetricCard title="Engagement Rate" value="4.2%" change={0.8} changeLabel="WoW" />
        )}
      </div>

      <TrendChart
        title={`${metrics.name} Followers (Last 30 Days)`}
        data={trend}
        lines={[{ dataKey: "followers", color: metrics.color, name: "Followers" }]}
        height={350}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Data Input</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {latestDb
              ? `Latest data from Supabase (${dataSource}, ${latestDb.date}). `
              : ""}
            Update LinkedIn stats via{" "}
            <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link>.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function XiaohongshuDetail() {
  const { data: dbData } = useChannelMetricsByChannel("xiaohongshu");
  const latestDb = dbData?.metrics?.[0];
  const followers = latestDb?.followers ?? 0;
  const dataSource = latestDb?.source;
  const dataDate = latestDb?.date;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={followers > 0 ? followers.toLocaleString() : "—"}
          icon={dataSource === "manual" ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge> : undefined}
        />
        <MetricCard title="Account" value="Tigu | Tiger Research" />
        <MetricCard title="RED ID" value="95032606859" />
        <MetricCard title="Market" value="China" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Data Source</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {latestDb
              ? `Data from Supabase (${dataSource}, updated ${dataDate}). `
              : "샤오홍슈(小红书)는 수동 업데이트 방식으로 운영합니다. "}
            <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link> 페이지에서 데이터를 입력할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function InstagramIdDetail() {
  const { data: dbData } = useChannelMetricsByChannel("instagram_id");
  const latestDb = dbData?.metrics?.[0];
  const followers = latestDb?.followers ?? 0;
  const impressions = latestDb?.impressions;
  const engagements = latestDb?.engagements;
  const engagementRate = latestDb?.engagement_rate;
  const dataSource = latestDb?.source;
  const dataDate = latestDb?.date;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={followers > 0 ? followers.toLocaleString() : "—"}
          icon={dataSource === "manual" ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge> : undefined}
        />
        <MetricCard title="Account" value="@tigerresearch_" />
        <MetricCard title="Market" value="Indonesia" />
        {impressions != null ? (
          <MetricCard title="Impressions" value={formatNumber(impressions)} />
        ) : (
          <MetricCard title="Impressions" value="—" />
        )}
      </div>

      {(engagements != null || engagementRate != null) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {engagements != null && <MetricCard title="Engagements" value={formatNumber(engagements)} />}
          {engagementRate != null && <MetricCard title="Engagement Rate" value={`${engagementRate}%`} />}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Data Source</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {latestDb
              ? `Data from Supabase (${dataSource}, updated ${dataDate}). `
              : "Instagram (Indonesia)는 수동 업데이트 방식으로 운영합니다. "}
            <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link> 페이지에서 데이터를 입력할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function XJpDetail() {
  const { data: dbData } = useChannelMetricsByChannel("x_jp");
  const latestDb = dbData?.metrics?.[0];
  const followers = latestDb?.followers ?? 0;
  const impressions = latestDb?.impressions;
  const engagements = latestDb?.engagements;
  const engagementRate = latestDb?.engagement_rate;
  const dataSource = latestDb?.source;
  const dataDate = latestDb?.date;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={followers > 0 ? followers.toLocaleString() : "—"}
          icon={dataSource === "manual" ? <Badge className="bg-orange-100 text-orange-700 text-[10px]">Manual</Badge> : undefined}
        />
        <MetricCard title="Account" value="@tr_japan_" />
        <MetricCard title="Market" value="Japan" />
        {impressions != null ? (
          <MetricCard title="Impressions" value={formatNumber(impressions)} />
        ) : (
          <MetricCard title="Impressions" value="—" />
        )}
      </div>

      {(engagements != null || engagementRate != null) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {engagements != null && <MetricCard title="Engagements" value={formatNumber(engagements)} />}
          {engagementRate != null && <MetricCard title="Engagement Rate" value={`${engagementRate}%`} />}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Data Source</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {latestDb
              ? `Data from Supabase (${dataSource}, updated ${dataDate}). `
              : "X (Japan)는 수동 업데이트 방식으로 운영합니다. "}
            <Link href="/input" className="text-orange-500 hover:underline">Data Input</Link> 페이지에서 데이터를 입력할 수 있습니다.
          </p>
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
      {channel === "telegram" && <TelegramDetail />}
      {channel === "x" && <XDetail />}
      {channel === "linkedin" && <LinkedInDetail metrics={metrics} />}
      {channel === "xiaohongshu" && <XiaohongshuDetail />}
      {channel === "instagram_id" && <InstagramIdDetail />}
      {channel === "x_jp" && <XJpDetail />}
      {!["youtube", "substack", "telegram", "x", "linkedin", "xiaohongshu", "instagram_id", "x_jp"].includes(channel) && (
        <DefaultDetail channel={channel} metrics={metrics} />
      )}
    </div>
  );
}

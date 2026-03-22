"use client";

import { useState, useMemo } from "react";
// Real data only - no demo data
import { useSubstackData, useYouTubeData, useXData, useTelegramPosts } from "@/lib/hooks";
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
import { Eye, Heart, MessageCircle, Share2, Calendar, FileText, Trophy, ArrowUpDown } from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { YouTubeIcon } from "@/components/icons/youtube-icon";

const channelColors: Record<string, string> = {
  Substack: "bg-orange-100 text-orange-700",
  X: "bg-gray-100 text-gray-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  YouTube: "bg-red-100 text-red-700",
  Telegram: "bg-cyan-100 text-cyan-700",
};

type ChannelFilter = "all" | "Substack" | "X" | "LinkedIn" | "Telegram" | "YouTube";
type SortKey = "date" | "views" | "likes";
type PeriodKey = "7D" | "4W" | "3M" | "6M" | "1Y" | "custom";

const channelFilters: { key: ChannelFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: null },
  { key: "Substack", label: "Substack", icon: <SubstackIcon className="h-3.5 w-3.5" /> },
  { key: "X", label: "X", icon: <XIcon className="h-3.5 w-3.5" /> },
  { key: "LinkedIn", label: "LinkedIn", icon: <LinkedInIcon className="h-3.5 w-3.5" /> },
  { key: "Telegram", label: "Telegram", icon: <TelegramIcon className="h-3.5 w-3.5" /> },
  { key: "YouTube", label: "YouTube", icon: <YouTubeIcon className="h-3.5 w-3.5" /> },
];

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string) {
  const to = new Date();
  const toStr = to.toISOString().split("T")[0];

  if (period === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  const from = new Date();
  switch (period) {
    case "7D": from.setDate(from.getDate() - 7); break;
    case "4W": from.setDate(from.getDate() - 28); break;
    case "3M": from.setMonth(from.getMonth() - 3); break;
    case "6M": from.setMonth(from.getMonth() - 6); break;
    case "1Y": from.setFullYear(from.getFullYear() - 1); break;
  }

  return { from: from.toISOString().split("T")[0], to: toStr };
}

export default function ContentPage() {
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [period, setPeriod] = useState<PeriodKey>("4W");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  const { from, to } = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  // Get real Substack posts from RSS
  const { data: substackData } = useSubstackData();
  const { data: ytData } = useYouTubeData();
  const { data: xData } = useXData();
  const { data: tgPosts } = useTelegramPosts();

  // Real data only
  const allContent = useMemo(() => {
    const items: { date: string; channel: string; title: string; views: number; likes: number; comments: number; shares: number }[] = [];

    // Substack posts from RSS
    if (substackData?.posts) {
      for (const post of substackData.posts) {
        const pubDate = new Date(post.pubDate).toISOString().split("T")[0];
        items.push({
          date: pubDate,
          channel: "Substack",
          title: post.title,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        });
      }
    }

    // YouTube videos from API
    if (ytData?.videos) {
      for (const video of ytData.videos) {
        const pubDate = new Date(video.publishedAt).toISOString().split("T")[0];
        items.push({
          date: pubDate,
          channel: "YouTube",
          title: video.title,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          shares: 0,
        });
      }
    }

    // X tweets from API
    if (xData?.tweets) {
      for (const tweet of xData.tweets) {
        const pubDate = new Date(tweet.createdAt).toISOString().split("T")[0];
        const title = tweet.text.slice(0, 80) + (tweet.text.length > 80 ? "..." : "");
        items.push({
          date: pubDate,
          channel: "X",
          title,
          views: tweet.metrics.impressions,
          likes: tweet.metrics.likes,
          comments: tweet.metrics.replies,
          shares: tweet.metrics.retweets + tweet.metrics.quotes,
        });
      }
    }

    // Telegram posts from public page
    if (tgPosts?.posts) {
      for (const post of tgPosts.posts) {
        items.push({
          date: post.date,
          channel: "Telegram",
          title: post.title,
          views: post.views,
          likes: 0,
          comments: 0,
          shares: 0,
        });
      }
    }

    return items;
  }, [substackData, ytData, xData, tgPosts]);

  // Filter by channel and date range
  const filtered = useMemo(() => {
    let items = allContent;

    if (channel !== "all") {
      items = items.filter((i) => i.channel === channel);
    }

    items = items.filter((i) => i.date >= from && i.date <= to);

    // Sort
    switch (sortBy) {
      case "date":
        items.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "views":
        items.sort((a, b) => b.views - a.views);
        break;
      case "likes":
        items.sort((a, b) => b.likes - a.likes);
        break;
    }

    return items;
  }, [allContent, channel, from, to, sortBy]);

  // Stats
  const totalPosts = filtered.length;
  const totalViews = filtered.reduce((s, c) => s + c.views, 0);
  const totalEngagement = filtered.reduce((s, c) => s + c.likes + c.comments + c.shares, 0);
  const bestPost = [...filtered].sort((a, b) => b.views - a.views)[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All content across channels
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["7D", "4W", "3M", "6M", "1Y", "custom"] as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "custom" ? "Custom" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === "custom" && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">From</span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm bg-background"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm bg-background"
          />
        </div>
      )}

      {/* Channel Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {channelFilters.map((cf) => (
          <button
            key={cf.key}
            onClick={() => setChannel(cf.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              channel === cf.key
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {cf.icon}
            {cf.label}
          </button>
        ))}
      </div>

      {/* Period info */}
      <div className="text-xs text-muted-foreground">
        {from} ~ {to}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalPosts}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatNumber(totalViews)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatNumber(totalEngagement)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Best Performing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestPost ? (
              <div>
                <span className="text-sm font-bold">{formatNumber(bestPost.views)} views</span>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{bestPost.title}</p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {(["date", "views", "likes"] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              sortBy === s
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "date" ? "Latest" : s === "views" ? "Top Views" : "Most Liked"}
          </button>
        ))}
      </div>

      {/* Content Table */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No content found for this period</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">
                    <Eye className="h-3.5 w-3.5 inline mr-1" />Views
                  </TableHead>
                  <TableHead className="text-right">
                    <Heart className="h-3.5 w-3.5 inline mr-1" />Likes
                  </TableHead>
                  <TableHead className="text-right">
                    <MessageCircle className="h-3.5 w-3.5 inline mr-1" />Comments
                  </TableHead>
                  <TableHead className="text-right">
                    <Share2 className="h-3.5 w-3.5 inline mr-1" />Shares
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={`${item.date}-${item.title}-${i}`} className={i === 0 && sortBy === "views" ? "bg-orange-50/50" : ""}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {item.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={channelColors[item.channel] || ""}>
                        {item.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.views > 0 ? item.views.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">{item.likes > 0 ? item.likes.toLocaleString() : "-"}</TableCell>
                    <TableCell className="text-right">{item.comments > 0 ? item.comments : "-"}</TableCell>
                    <TableCell className="text-right">{item.shares > 0 ? item.shares : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

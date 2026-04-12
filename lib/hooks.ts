"use client";

import { useState, useEffect } from "react";

// Generic fetch hook
function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Failed to fetch"))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// YouTube
export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  formattedDuration: string;
}
export interface YouTubeData {
  channel: { title: string; subscribers: number; totalViews: number; videoCount: number };
  videos: YouTubeVideo[];
  summary: {
    totalViewsInList: number;
    avgDurationSeconds: number;
    avgDurationFormatted: string;
    videoCount: number;
  };
}
export function useYouTubeData() {
  return useApiData<YouTubeData>("/api/youtube");
}

// YouTube Analytics (period-based)
export interface YouTubeAnalyticsData {
  views: number;
  prevViews: number;
  viewsChangePercent: number;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
  prevNetSubscribers: number;
  watchMinutes: number;
  days: number;
  period: string;
}
export function useYouTubeAnalytics(days?: number) {
  const params = days ? `?days=${days}` : "";
  return useApiData<YouTubeAnalyticsData>(`/api/youtube-analytics${params}`);
}

// Substack
interface SubstackData {
  posts: { title: string; link: string; pubDate: string; description: string }[];
  totalPosts: number;
}
export function useSubstackData() {
  return useApiData<SubstackData>("/api/substack");
}

// Substack Internal Stats (dashboard API)
export interface SubstackStatsData {
  subscribers: number;
  subscribersStart: number;
  subscribersChange: number;
  subsGained: number;
  subsLost: number;
  paidSubscribers: number;
  appSubscribers: number;
  views: number;
  prevViews: number;
  viewsChangePercent: number;
  openRate: number;
  openRateDiff: number;
  range: number;
  posts: { title: string; slug: string; postDate: string; views: number; openRate: number; clickRate: number; reactions: number }[];
}
export function useSubstackStats(rangeDays?: number) {
  const params = rangeDays ? `?range=${rangeDays}` : "";
  return useApiData<SubstackStatsData>(`/api/substack-stats${params}`);
}

// GA4
export interface GA4Data {
  daily: { date: string; visitors: number; pageviews: number; newUsers: number; avgSessionDuration: number; bounceRate: number }[];
  sources: { name: string; value: number; color: string }[];
  pages: { name: string; pageviews: number; avgTime: string }[];
  regions: { name: string; value: number; color: string }[];
  summary: { totalVisitors: number; totalPageviews: number };
}
export function useGA4Data(from?: string, to?: string) {
  const params = from && to ? `?from=${from}&to=${to}` : "";
  return useApiData<GA4Data>(`/api/analytics${params}`);
}

// Search Console
export interface SearchConsoleData {
  daily: { date: string; impressions: number; clicks: number; position: number; ctr: number }[];
  keywords: { keyword: string; clicks: number; impressions: number; position: number; ctr: number }[];
  pages: { page: string; clicks: number; impressions: number; position: number; ctr: number }[];
  summary: { totalImpressions: number; totalClicks: number; avgPosition: number; avgCtr: number };
}
export function useSearchConsoleData(from?: string, to?: string) {
  const params = from && to ? `?from=${from}&to=${to}` : "";
  return useApiData<SearchConsoleData>(`/api/search-console${params}`);
}

// Telegram
interface TelegramData {
  channel: { title: string; username: string; description: string; members: number; type: string };
}
export function useTelegramData() {
  return useApiData<TelegramData>("/api/telegram");
}

// X (Twitter)
interface XTweetMetrics {
  retweets: number;
  replies: number;
  likes: number;
  quotes: number;
  impressions: number;
}
interface XTweet {
  id: string;
  text: string;
  createdAt: string;
  metrics: XTweetMetrics;
}
export interface XData {
  user: {
    name: string;
    username: string;
    description: string;
    profileImageUrl: string;
    createdAt: string;
    followers: number;
    following: number;
    tweetCount: number;
  };
  tweets: XTweet[];
}
export function useXData(username?: string) {
  const params = username ? `?username=${username}` : "";
  return useApiData<XData>(`/api/x${params}`);
}

// Telegram Posts
interface TelegramPostsData {
  posts: { date: string; title: string; views: number }[];
  totalPosts: number;
}
export function useTelegramPosts() {
  return useApiData<TelegramPostsData>("/api/telegram-posts");
}

// Channel Metrics from Supabase
export interface ChannelMetric {
  id: number;
  channel: string;
  date: string;
  followers: number | null;
  impressions: number | null;
  engagements: number | null;
  engagement_rate: number | null;
  source: "auto" | "manual";
  created_at: string;
}

interface ChannelMetricsResponse {
  metrics: ChannelMetric[];
}

export function useChannelMetrics(latest = true) {
  return useApiData<ChannelMetricsResponse>(
    `/api/metrics${latest ? "?latest=true" : ""}`
  );
}

export function useChannelMetricsByChannel(channel: string) {
  return useApiData<ChannelMetricsResponse>(
    `/api/metrics?channel=${channel}`
  );
}

export function useChannelMetricsRange(from: string, to: string) {
  return useApiData<ChannelMetricsResponse>(
    `/api/metrics?from=${from}&to=${to}`
  );
}

// Channel Sheet (Marketing Performance spreadsheet)
export interface ChannelSheetData {
  channels: Record<string, {
    followers: number;
    prevFollowers: number;
    followersChange: number;
    followersChangePercent: number;
    impressions: number;
    prevImpressions: number;
    impressionsChange: number;
    impressionsChangePercent: number;
  }>;
  currentDate: string;
  prevDate: string;
  followerTrend: Record<string, unknown>[];
  impressionTrend: Record<string, unknown>[];
}
export function useChannelSheet() {
  return useApiData<ChannelSheetData>("/api/channel-sheet");
}

// Comparison hook: fetches current period + previous period
export interface ComparisonResult {
  channel: string;
  current: ChannelMetric | null;
  previous: ChannelMetric | null;
  changePercent: number | null;
}

export function useComparisonMetrics(from: string, to: string) {
  // Calculate previous period (same duration, immediately before)
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const duration = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1); // day before current from
  const prevFrom = new Date(prevTo.getTime() - duration);
  const prevFromStr = prevFrom.toISOString().split("T")[0];
  const prevToStr = prevTo.toISOString().split("T")[0];

  const { data: currentData, loading: l1 } = useChannelMetricsRange(from, to);
  const { data: prevData, loading: l2 } = useChannelMetricsRange(prevFromStr, prevToStr);

  const comparisons: ComparisonResult[] = [];

  if (currentData?.metrics && prevData?.metrics) {
    const channels = ["substack", "x", "linkedin", "youtube", "telegram"];
    for (const ch of channels) {
      const curr = currentData.metrics.find((m) => m.channel === ch) || null;
      const prev = prevData.metrics.find((m) => m.channel === ch) || null;
      let changePercent: number | null = null;
      if (curr?.followers != null && prev?.followers != null && prev.followers > 0) {
        changePercent = Math.round(((curr.followers - prev.followers) / prev.followers) * 1000) / 10;
      }
      comparisons.push({ channel: ch, current: curr, previous: prev, changePercent });
    }
  }

  return {
    comparisons,
    loading: l1 || l2,
    prevFromStr,
    prevToStr,
  };
}

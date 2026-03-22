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
interface YouTubeData {
  channel: { title: string; subscribers: number; totalViews: number; videoCount: number };
  videos: { id: string; title: string; publishedAt: string; views: number; likes: number; comments: number }[];
}
export function useYouTubeData() {
  return useApiData<YouTubeData>("/api/youtube");
}

// Substack
interface SubstackData {
  posts: { title: string; link: string; pubDate: string; description: string }[];
  totalPosts: number;
}
export function useSubstackData() {
  return useApiData<SubstackData>("/api/substack");
}

// GA4
export interface GA4Data {
  daily: { date: string; visitors: number; pageviews: number; newUsers: number; avgSessionDuration: number; bounceRate: number }[];
  sources: { name: string; value: number; color: string }[];
  pages: { name: string; pageviews: number; avgTime: string }[];
  regions: { name: string; value: number; color: string }[];
  summary: { totalVisitors: number; totalPageviews: number };
}
export function useGA4Data() {
  return useApiData<GA4Data>("/api/analytics");
}

// Search Console
export interface SearchConsoleData {
  daily: { date: string; impressions: number; clicks: number; position: number; ctr: number }[];
  keywords: { keyword: string; clicks: number; impressions: number; position: number; ctr: number }[];
  pages: { page: string; clicks: number; impressions: number; position: number; ctr: number }[];
  summary: { totalImpressions: number; totalClicks: number; avgPosition: number; avgCtr: number };
}
export function useSearchConsoleData() {
  return useApiData<SearchConsoleData>("/api/search-console");
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
export function useXData() {
  return useApiData<XData>("/api/x");
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

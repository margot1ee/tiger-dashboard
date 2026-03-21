// Demo data for development before APIs are connected
// Uses deterministic values to avoid hydration mismatch

import { format, subDays } from "date-fns";

// Simple seeded pseudo-random to avoid hydration mismatch
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDailyData(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(2026, 2, 21), days - 1 - i); // fixed base date
    const base = 800 + Math.floor(seededRandom(i + 1) * 400);
    return {
      date: format(date, "MM/dd"),
      visitors: base,
      pageviews: base + Math.floor(seededRandom(i + 100) * 600),
      newVisitors: Math.floor(base * 0.6),
      returningVisitors: Math.floor(base * 0.4),
    };
  });
}

export const trafficData = generateDailyData(30);

export const channelMetrics = {
  substack: {
    name: "Substack",
    followers: 22340,
    change: 3.2,
    color: "#FF6719",
  },
  x: {
    name: "X (Twitter)",
    followers: 18700,
    change: 1.8,
    color: "#000000",
  },
  linkedin: {
    name: "LinkedIn",
    followers: 1397,
    change: 5.4,
    color: "#0A66C2",
  },
  youtube: {
    name: "YouTube",
    followers: 245,
    change: 12.5,
    color: "#FF0000",
  },
  telegram: {
    name: "Telegram",
    followers: 3200,
    change: 2.1,
    color: "#26A5E4",
  },
};

export const followerTrend = Array.from({ length: 12 }, (_, i) => {
  const month = format(subDays(new Date(2026, 2, 21), (11 - i) * 30), "yyyy/MM");
  return {
    date: month,
    Substack: 18000 + i * 400 + Math.floor(seededRandom(i + 200) * 200),
    X: 16000 + i * 250 + Math.floor(seededRandom(i + 300) * 150),
    LinkedIn: 800 + i * 55 + Math.floor(seededRandom(i + 400) * 30),
    YouTube: 50 + i * 18 + Math.floor(seededRandom(i + 500) * 10),
    Telegram: 2200 + i * 90 + Math.floor(seededRandom(i + 600) * 50),
  };
});

export const trafficSources = [
  { name: "Organic Search", value: 42, color: "#22c55e" },
  { name: "Social", value: 28, color: "#3b82f6" },
  { name: "Direct", value: 18, color: "#f97316" },
  { name: "Referral", value: 12, color: "#8b5cf6" },
];

export const popularPages = [
  { name: "Bitcoin Valuation Q3", pageviews: 12450, avgTime: "4:32" },
  { name: "Asia Web3 Market Recap", pageviews: 9870, avgTime: "3:45" },
  { name: "Korea Crypto Guide 2025", pageviews: 8340, avgTime: "5:12" },
  { name: "Vietnam Web3 Landscape", pageviews: 6720, avgTime: "3:28" },
  { name: "Japan Regulatory Update", pageviews: 5980, avgTime: "2:56" },
  { name: "Gomble Games Analysis", pageviews: 5430, avgTime: "4:08" },
  { name: "Digital Asset Infra Gap", pageviews: 4890, avgTime: "3:15" },
  { name: "Indonesia DeFi Report", pageviews: 4210, avgTime: "3:42" },
  { name: "10 Predictions 2026", pageviews: 3980, avgTime: "6:20" },
  { name: "Thailand Crypto Adoption", pageviews: 3540, avgTime: "2:48" },
];

export const searchKeywords = [
  { keyword: "tiger research", clicks: 3240, impressions: 18500, position: 1.2, ctr: 17.5 },
  { keyword: "asia web3 market", clicks: 1890, impressions: 24300, position: 3.4, ctr: 7.8 },
  { keyword: "bitcoin valuation model", clicks: 1560, impressions: 32100, position: 5.2, ctr: 4.9 },
  { keyword: "korea crypto regulation", clicks: 1230, impressions: 15800, position: 2.8, ctr: 7.8 },
  { keyword: "vietnam blockchain", clicks: 980, impressions: 12400, position: 4.1, ctr: 7.9 },
  { keyword: "web3 asia report", clicks: 870, impressions: 9800, position: 2.1, ctr: 8.9 },
  { keyword: "crypto market analysis asia", clicks: 760, impressions: 11200, position: 6.3, ctr: 6.8 },
  { keyword: "japan crypto law", clicks: 650, impressions: 8900, position: 3.7, ctr: 7.3 },
  { keyword: "indonesia defi", clicks: 540, impressions: 7600, position: 5.8, ctr: 7.1 },
  { keyword: "singapore web3 companies", clicks: 480, impressions: 6200, position: 4.5, ctr: 7.7 },
];

export const searchTrend = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(2026, 2, 21), 29 - i), "MM/dd"),
  impressions: 500 + Math.floor(seededRandom(i + 700) * 300) + i * 10,
  clicks: 40 + Math.floor(seededRandom(i + 800) * 30) + i * 2,
}));

export const regionData = [
  { name: "South Korea", value: 35, color: "#f97316" },
  { name: "Japan", value: 15, color: "#ef4444" },
  { name: "Vietnam", value: 12, color: "#22c55e" },
  { name: "Indonesia", value: 10, color: "#3b82f6" },
  { name: "Singapore", value: 8, color: "#8b5cf6" },
  { name: "US", value: 7, color: "#ec4899" },
  { name: "Others", value: 13, color: "#6b7280" },
];

export const contentPerformance = [
  { date: "2026-03-18", channel: "Substack", title: "Short-Term Uncertainty Rising", views: 4230, likes: 312, comments: 45, shares: 89 },
  { date: "2026-03-15", channel: "X", title: "Thread: Asia Crypto Outlook", views: 28400, likes: 890, comments: 124, shares: 432 },
  { date: "2026-03-12", channel: "LinkedIn", title: "Digital Asset Infrastructure Gap", views: 2340, likes: 156, comments: 28, shares: 67 },
  { date: "2026-03-10", channel: "YouTube", title: "Bitcoin Valuation Deep Dive", views: 1560, likes: 98, comments: 34, shares: 23 },
  { date: "2026-03-08", channel: "Substack", title: "Gomble Games: Hypercasual Hero", views: 5670, likes: 423, comments: 67, shares: 134 },
  { date: "2026-03-05", channel: "X", title: "Thread: Korea DeFi Update", views: 19800, likes: 654, comments: 89, shares: 298 },
  { date: "2026-03-03", channel: "Substack", title: "Vietnam Web3 Landscape 2026", views: 3890, likes: 267, comments: 38, shares: 78 },
  { date: "2026-03-01", channel: "LinkedIn", title: "Nexblock Partnership Announcement", views: 1890, likes: 234, comments: 45, shares: 56 },
];

export const weeklyInsights = [
  {
    type: "growth" as const,
    title: "Substack subscribers +320 this week",
    detail: "3.2% WoW growth, driven by Bitcoin Valuation report",
  },
  {
    type: "spike" as const,
    title: "Organic traffic up 15%",
    detail: "'asia web3 market' keyword ranking improved from #5 to #3",
  },
  {
    type: "content" as const,
    title: "Top content: 'Short-Term Uncertainty Rising'",
    detail: "4,230 views in 3 days, highest engagement rate this month",
  },
  {
    type: "alert" as const,
    title: "LinkedIn engagement rate declining",
    detail: "Down 8% vs last week. Consider more visual/carousel posts",
  },
  {
    type: "keyword" as const,
    title: "Rising keyword: 'bitcoin valuation model'",
    detail: "Impressions +42% WoW, clicks +28%. Opportunity for more content",
  },
];

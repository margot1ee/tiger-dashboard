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
    followers: 22630,
    change: -0.2,
    color: "#FF6719",
    impressions: 32800,
    impressionsChange: 47.75,
  },
  x: {
    name: "X",
    followers: 9302,
    change: -0.02,
    color: "#000000",
    impressions: 25622,
    impressionsChange: 271.33,
  },
  linkedin: {
    name: "LinkedIn",
    followers: 1449,
    change: 3.1,
    color: "#0A66C2",
    impressions: 3819,
    impressionsChange: 63.41,
  },
  youtube: {
    name: "YouTube",
    followers: 467,
    change: 0.4,
    color: "#FF0000",
    impressions: 528,
    impressionsChange: 0,
  },
  telegram: {
    name: "Telegram",
    followers: 1733,
    change: -0.06,
    color: "#26A5E4",
    impressions: 154,
    impressionsChange: -77.75,
  },
  xiaohongshu: {
    name: "小红书",
    followers: 1880,
    change: -0.2,
    color: "#FF2442",
    impressions: 11800,
    impressionsChange: 0,
  },
  instagram_id: {
    name: "Instagram (ID)",
    followers: 1332,
    change: 12.5,
    color: "#E4405F",
    impressions: 1063,
    impressionsChange: -86.76,
  },
  x_jp: {
    name: "X (JP)",
    followers: 22,
    change: 0,
    color: "#000000",
    impressions: 0,
    impressionsChange: 0,
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
  { name: "Organic Search", value: 420, color: "#22c55e" },
  { name: "Social", value: 280, color: "#3b82f6" },
  { name: "Direct", value: 180, color: "#f97316" },
  { name: "Referral", value: 120, color: "#8b5cf6" },
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
    type: "alert" as const,
    title: "Substack 구독자 -47명 감소 (22,677 → 22,630)",
    detail: "3주 연속 하락세. WoW -0.21%. 콘텐츠 주제 다양화 또는 리텐션 캠페인 검토 필요",
  },
  {
    type: "growth" as const,
    title: "LinkedIn 팔로워 +44명, 최근 10주 최대 성장",
    detail: "1,405 → 1,449 (+3.13% WoW). 임프레션도 2,337 → 3,819 (+63.4%) 급증",
  },
  {
    type: "spike" as const,
    title: "X 임프레션 6,900 → 25,622 (+271% WoW)",
    detail: "팔로워는 거의 변동 없으나(-2명) 임프레션 급증. 바이럴 콘텐츠 또는 외부 유입 확인 필요",
  },
  {
    type: "growth" as const,
    title: "Instagram (ID) 팔로워 +148명 (1,184 → 1,332)",
    detail: "+12.5% WoW. 전 채널 중 가장 높은 팔로워 성장률. 인도네시아 시장 성장세 지속",
  },
  {
    type: "alert" as const,
    title: "Telegram 임프레션 692 → 154 (-77.8% WoW)",
    detail: "포스트 조회수 급감. 콘텐츠 빈도 또는 포스팅 시간대 재검토 필요",
  },
  {
    type: "alert" as const,
    title: "Instagram (ID) 조회수 8,028 → 1,063 (-86.8% WoW)",
    detail: "팔로워는 증가하나 콘텐츠 도달률 급감. 알고리즘 변화 또는 콘텐츠 전략 점검 필요",
  },
  {
    type: "content" as const,
    title: "Substack 임프레션 22,200 → 32,800 (+47.7% WoW)",
    detail: "구독자는 줄었으나 임프레션 대폭 증가. 비구독자 유입 증가 → 전환 기회",
  },
  {
    type: "alert" as const,
    title: "YouTube 성장 둔화: 팔로워 +2명, 조회수 528 (-11.6%)",
    detail: "직전 주 대비 성장세 크게 둔화 (465→467). 영상 업로드 빈도 또는 주제 재검토",
  },
];

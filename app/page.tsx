"use client";

import { useState, useMemo } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  channelMetrics,
  followerTrend,
  trafficData,
} from "@/lib/demo-data";
import { useYouTubeData, useTelegramData, useXData, useChannelMetrics, useComparisonMetrics, useGA4Data } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Eye,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { XiaohongshuIcon } from "@/components/icons/xiaohongshu-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelIcons: Record<string, React.ReactNode> = {
  substack: <SubstackIcon className="h-5 w-5" />,
  x: <XIcon className="h-5 w-5" />,
  linkedin: <LinkedInIcon className="h-5 w-5" />,
  youtube: <YouTubeIcon className="h-5 w-5" />,
  telegram: <TelegramIcon className="h-5 w-5" />,
  xiaohongshu: <XiaohongshuIcon className="h-5 w-5 text-[#FF2442]" />,
  instagram_id: <InstagramIcon className="h-5 w-5 text-[#E4405F]" />,
  x_jp: <XIcon className="h-5 w-5" />,
};

const channelColors: Record<string, string> = {
  substack: "",
  x: "",
  linkedin: "",
  youtube: "",
  telegram: "",
  xiaohongshu: "",
  instagram_id: "",
  x_jp: "",
};

const channelOrder = ["substack", "x", "linkedin", "youtube", "telegram", "xiaohongshu", "instagram_id", "x_jp"];

type PeriodKey = "7D" | "4W" | "3M" | "6M" | "1Y" | "custom";

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string) {
  const to = new Date();
  const toStr = to.toISOString().split("T")[0];
  if (period === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
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

function getPeriodLabel(period: PeriodKey) {
  switch (period) {
    case "7D": return "vs prev 7 days";
    case "4W": return "vs prev 4 weeks";
    case "3M": return "vs prev 3 months";
    case "6M": return "vs prev 6 months";
    case "1Y": return "vs prev year";
    case "custom": return "vs prev period";
  }
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<PeriodKey>("7D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const { data: ytData } = useYouTubeData();
  const { data: tgData } = useTelegramData();
  const { data: xData } = useXData();
  const { data: dbMetrics } = useChannelMetrics(true);
  const { comparisons, prevFromStr, prevToStr } = useComparisonMetrics(from, to);
  const { data: ga4Data } = useGA4Data(from, to);
  const { data: ga4PrevData } = useGA4Data(prevFromStr, prevToStr);

  const mergedMetrics = { ...channelMetrics };
  if (ytData) mergedMetrics.youtube = { ...mergedMetrics.youtube, followers: ytData.channel.subscribers };
  if (tgData) mergedMetrics.telegram = { ...mergedMetrics.telegram, followers: tgData.channel.members };
  if (xData) mergedMetrics.x = { ...mergedMetrics.x, followers: xData.user.followers };
  if (dbMetrics?.metrics) {
    for (const row of dbMetrics.metrics) {
      const key = row.channel as keyof typeof mergedMetrics;
      if (mergedMetrics[key] && row.followers != null) mergedMetrics[key] = { ...mergedMetrics[key], followers: row.followers };
    }
  }

  const getChange = (channelKey: string): number | undefined => {
    const comp = comparisons.find((c) => c.channel === channelKey);
    if (comp?.changePercent != null) return comp.changePercent;
    return mergedMetrics[channelKey as keyof typeof mergedMetrics]?.change;
  };

  const totalFollowers = Object.values(mergedMetrics).reduce((sum, ch) => sum + ch.followers, 0);

  const ga4Visitors = ga4Data?.summary?.totalVisitors ?? trafficData[trafficData.length - 1]?.visitors ?? 0;
  const ga4Pageviews = ga4Data?.summary?.totalPageviews ?? trafficData[trafficData.length - 1]?.pageviews ?? 0;
  const ga4PrevVisitors = ga4PrevData?.summary?.totalVisitors ?? 0;
  const ga4PrevPageviews = ga4PrevData?.summary?.totalPageviews ?? 0;

  const visitorsChange = ga4PrevVisitors > 0 ? Math.round(((ga4Visitors - ga4PrevVisitors) / ga4PrevVisitors) * 1000) / 10 : 0;
  const pageviewsChange = ga4PrevPageviews > 0 ? Math.round(((ga4Pageviews - ga4PrevPageviews) / ga4PrevPageviews) * 1000) / 10 : 0;

  const avgSessionSeconds = ga4Data?.daily?.length ? ga4Data.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4Data.daily.length : 204;
  const avgMins = Math.floor(avgSessionSeconds / 60);
  const avgSecs = Math.round(avgSessionSeconds % 60);
  const avgSessionStr = `${avgMins}:${String(avgSecs).padStart(2, "0")}`;
  const prevAvgSession = ga4PrevData?.daily?.length ? ga4PrevData.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4PrevData.daily.length : 0;
  const sessionChange = prevAvgSession > 0 ? Math.round(((avgSessionSeconds - prevAvgSession) / prevAvgSession) * 1000) / 10 : 0;

  const chartTrafficData = ga4Data?.daily ?? trafficData;
  const periodLabel = getPeriodLabel(period);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All channels at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["7D", "4W", "3M", "6M", "1Y", "custom"] as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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

      {period === "custom" && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">From</span>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          <span className="text-muted-foreground">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          {customFrom && customTo && <span className="text-xs text-muted-foreground">comparing with {prevFromStr} ~ {prevToStr}</span>}
        </div>
      )}

      {period !== "custom" && (
        <div className="text-xs text-muted-foreground -mt-4">{from} ~ {to} · {periodLabel}</div>
      )}

      {/* ── Website Traffic ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-orange-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Website Traffic</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard title="Visitors" value={formatNumber(ga4Visitors)} change={visitorsChange} changeLabel={periodLabel} icon={<Eye className="h-4 w-4" />} />
          <MetricCard title="Pageviews" value={formatNumber(ga4Pageviews)} change={pageviewsChange} changeLabel={periodLabel} icon={<Globe className="h-4 w-4" />} />
          <MetricCard title="Avg. Session" value={avgSessionStr} change={sessionChange} changeLabel={periodLabel} icon={<Clock className="h-4 w-4" />} />
        </div>
      </section>

      {/* ── Social Performance ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-blue-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Social Performance</h2>
        </div>

        {/* Total Followers */}
        <div className="flex items-center gap-3 border rounded-lg px-4 py-2.5 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Followers</span>
          <span className="text-xl font-bold">{formatNumber(totalFollowers)}</span>
        </div>

        {/* Channel Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {channelOrder.map((key) => {
            const ch = mergedMetrics[key as keyof typeof mergedMetrics];
            if (!ch) return null;
            const change = getChange(key);
            const isPositive = change !== undefined && change > 0;
            const isNegative = change !== undefined && change < 0;
            return (
              <Card key={key} className={`border ${channelColors[key] || ""} transition-all hover:shadow-md`}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-white/80 border flex items-center justify-center shadow-sm">
                      {channelIcons[key]}
                    </div>
                    {change !== undefined && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-muted-foreground"}`}>
                        {isPositive && <TrendingUp className="h-3 w-3" />}
                        {isNegative && <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}{change}%
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{formatNumber(ch.followers)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ch.name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Trends ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-violet-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Trends</h2>
        </div>
        <Tabs defaultValue="followers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="followers">Follower Trend</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Trend</TabsTrigger>
          </TabsList>
          <TabsContent value="followers">
            <TrendChart
              title="Follower Growth (Monthly)"
              data={followerTrend}
              lines={[
                { dataKey: "Substack", color: "#FF6719", name: "Substack" },
                { dataKey: "X", color: "#000000", name: "X" },
                { dataKey: "LinkedIn", color: "#0A66C2", name: "LinkedIn" },
                { dataKey: "Telegram", color: "#26A5E4", name: "Telegram" },
                { dataKey: "YouTube", color: "#FF0000", name: "YouTube" },
              ]}
              height={350}
            />
          </TabsContent>
          <TabsContent value="traffic">
            <TrendChart
              title="Traffic Trend"
              data={chartTrafficData}
              lines={[
                { dataKey: "visitors", color: "#f97316", name: "Visitors" },
                { dataKey: "pageviews", color: "#3b82f6", name: "Pageviews" },
              ]}
              height={350}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

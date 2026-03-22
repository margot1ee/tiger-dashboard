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
import {
  Globe,
  Eye,
  Clock,
  Calendar,
  Users,
} from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelIcons: Record<string, React.ReactNode> = {
  substack: <SubstackIcon className="h-4 w-4" />,
  x: <XIcon className="h-4 w-4" />,
  linkedin: <LinkedInIcon className="h-4 w-4" />,
  youtube: <YouTubeIcon className="h-4 w-4" />,
  telegram: <TelegramIcon className="h-4 w-4" />,
};

// Order: Substack first, then rest
const channelOrder = ["substack", "x", "linkedin", "youtube", "telegram"];

type PeriodKey = "7D" | "4W" | "3M" | "custom";

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string) {
  const to = new Date();
  const toStr = to.toISOString().split("T")[0];

  if (period === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  const from = new Date();
  switch (period) {
    case "7D":
      from.setDate(from.getDate() - 7);
      break;
    case "4W":
      from.setDate(from.getDate() - 28);
      break;
    case "3M":
      from.setMonth(from.getMonth() - 3);
      break;
  }

  return { from: from.toISOString().split("T")[0], to: toStr };
}

function getPeriodLabel(period: PeriodKey) {
  switch (period) {
    case "7D": return "vs prev 7 days";
    case "4W": return "vs prev 4 weeks";
    case "3M": return "vs prev 3 months";
    case "custom": return "vs prev period";
  }
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<PeriodKey>("7D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const { data: ytData } = useYouTubeData();
  const { data: tgData } = useTelegramData();
  const { data: xData } = useXData();
  const { data: dbMetrics } = useChannelMetrics(true);
  const { comparisons, prevFromStr, prevToStr } = useComparisonMetrics(from, to);
  const { data: ga4Data } = useGA4Data(from, to);
  const { data: ga4PrevData } = useGA4Data(prevFromStr, prevToStr);

  // Priority: manual DB > auto DB > live API > demo data
  const mergedMetrics = { ...channelMetrics };

  if (ytData) {
    mergedMetrics.youtube = { ...mergedMetrics.youtube, followers: ytData.channel.subscribers };
  }
  if (tgData) {
    mergedMetrics.telegram = { ...mergedMetrics.telegram, followers: tgData.channel.members };
  }
  if (xData) {
    mergedMetrics.x = { ...mergedMetrics.x, followers: xData.user.followers };
  }

  if (dbMetrics?.metrics) {
    for (const row of dbMetrics.metrics) {
      const key = row.channel as keyof typeof mergedMetrics;
      if (mergedMetrics[key] && row.followers != null) {
        mergedMetrics[key] = { ...mergedMetrics[key], followers: row.followers };
      }
    }
  }

  const getChange = (channelKey: string): number | undefined => {
    const comp = comparisons.find((c) => c.channel === channelKey);
    if (comp?.changePercent != null) return comp.changePercent;
    return mergedMetrics[channelKey as keyof typeof mergedMetrics]?.change;
  };

  const totalFollowers = Object.values(mergedMetrics).reduce((sum, ch) => sum + ch.followers, 0);

  // GA4 period data
  const ga4Visitors = ga4Data?.summary?.totalVisitors ?? trafficData[trafficData.length - 1]?.visitors ?? 0;
  const ga4Pageviews = ga4Data?.summary?.totalPageviews ?? trafficData[trafficData.length - 1]?.pageviews ?? 0;
  const ga4PrevVisitors = ga4PrevData?.summary?.totalVisitors ?? 0;
  const ga4PrevPageviews = ga4PrevData?.summary?.totalPageviews ?? 0;

  const visitorsChange = ga4PrevVisitors > 0
    ? Math.round(((ga4Visitors - ga4PrevVisitors) / ga4PrevVisitors) * 1000) / 10
    : 0;
  const pageviewsChange = ga4PrevPageviews > 0
    ? Math.round(((ga4Pageviews - ga4PrevPageviews) / ga4PrevPageviews) * 1000) / 10
    : 0;

  // Avg session duration from GA4
  const avgSessionSeconds = ga4Data?.daily?.length
    ? ga4Data.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4Data.daily.length
    : 204;
  const avgMins = Math.floor(avgSessionSeconds / 60);
  const avgSecs = Math.round(avgSessionSeconds % 60);
  const avgSessionStr = `${avgMins}:${String(avgSecs).padStart(2, "0")}`;

  const prevAvgSession = ga4PrevData?.daily?.length
    ? ga4PrevData.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4PrevData.daily.length
    : 0;
  const sessionChange = prevAvgSession > 0
    ? Math.round(((avgSessionSeconds - prevAvgSession) / prevAvgSession) * 1000) / 10
    : 0;

  const chartTrafficData = ga4Data?.daily ?? trafficData;
  const periodLabel = getPeriodLabel(period);

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All channels at a glance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["7D", "4W", "3M", "custom"] as PeriodKey[]).map((p) => (
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
          {customFrom && customTo && (
            <span className="text-xs text-muted-foreground">
              comparing with {prevFromStr} ~ {prevToStr}
            </span>
          )}
        </div>
      )}

      {/* Period info */}
      {period !== "custom" && (
        <div className="text-xs text-muted-foreground">
          {from} ~ {to} · {periodLabel}
        </div>
      )}

      {/* ── Section 1: Website Traffic (GA4) ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Website Traffic
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Visitors"
            value={formatNumber(ga4Visitors)}
            change={visitorsChange}
            changeLabel={periodLabel}
            icon={<Eye className="h-4 w-4" />}
          />
          <MetricCard
            title="Pageviews"
            value={formatNumber(ga4Pageviews)}
            change={pageviewsChange}
            changeLabel={periodLabel}
            icon={<Globe className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg. Session"
            value={avgSessionStr}
            change={sessionChange}
            changeLabel={periodLabel}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* ── Section 2: Social Performance ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Social Performance
        </h2>

        {/* Total Followers Bar */}
        <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-2.5 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Total Followers</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{formatNumber(totalFollowers)}</span>
            {getChange("substack") !== undefined && (
              <span className={`text-xs font-medium ${2.8 >= 0 ? "text-green-500" : "text-red-500"}`}>
                {periodLabel}
              </span>
            )}
          </div>
        </div>

        {/* Channel Cards - Substack first */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {channelOrder.map((key) => {
            const ch = mergedMetrics[key as keyof typeof mergedMetrics];
            if (!ch) return null;
            return (
              <MetricCard
                key={key}
                title={ch.name}
                value={formatNumber(ch.followers)}
                change={getChange(key)}
                changeLabel={periodLabel}
                icon={channelIcons[key]}
              />
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Trends ── */}
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
    </div>
  );
}

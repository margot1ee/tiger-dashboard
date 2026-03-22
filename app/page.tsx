"use client";

import { useState, useMemo } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  channelMetrics,
  followerTrend,
  trafficData,
} from "@/lib/demo-data";
import { useYouTubeData, useTelegramData, useXData, useChannelMetrics, useComparisonMetrics } from "@/lib/hooks";
import {
  Globe,
  Eye,
  Clock,
  Calendar,
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

type PeriodKey = "7D" | "4W" | "3M" | "custom";

function formatNumber(n: number) {
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
    case "7D": return "vs previous 7 days";
    case "4W": return "vs previous 4 weeks";
    case "3M": return "vs previous 3 months";
    case "custom": return "vs previous period";
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

  // Priority: manual DB > auto DB > live API > demo data
  const mergedMetrics = { ...channelMetrics };

  // Layer 1: Live API data (lower priority than DB)
  if (ytData) {
    mergedMetrics.youtube = {
      ...mergedMetrics.youtube,
      followers: ytData.channel.subscribers,
    };
  }
  if (tgData) {
    mergedMetrics.telegram = {
      ...mergedMetrics.telegram,
      followers: tgData.channel.members,
    };
  }
  if (xData) {
    mergedMetrics.x = {
      ...mergedMetrics.x,
      followers: xData.user.followers,
    };
  }

  // Layer 2: DB data (highest priority - manual overrides auto)
  if (dbMetrics?.metrics) {
    for (const row of dbMetrics.metrics) {
      const key = row.channel as keyof typeof mergedMetrics;
      if (mergedMetrics[key] && row.followers != null) {
        mergedMetrics[key] = {
          ...mergedMetrics[key],
          followers: row.followers,
        };
      }
    }
  }

  // Apply comparison data for change percentages
  const getChange = (channelKey: string): number | undefined => {
    const comp = comparisons.find((c) => c.channel === channelKey);
    if (comp?.changePercent != null) return comp.changePercent;
    return mergedMetrics[channelKey as keyof typeof mergedMetrics]?.change;
  };

  const totalFollowers = Object.values(mergedMetrics).reduce(
    (sum, ch) => sum + ch.followers,
    0
  );
  const latestTraffic = trafficData[trafficData.length - 1];
  const prevTraffic = trafficData[trafficData.length - 8];
  const trafficChange = prevTraffic
    ? Math.round(
        ((latestTraffic.visitors - prevTraffic.visitors) / prevTraffic.visitors) *
          100 *
          10
      ) / 10
    : 0;

  const periodLabel = getPeriodLabel(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All channels at a glance
          </p>
        </div>

        {/* Period Selector */}
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

      {/* Period comparison label */}
      {period !== "custom" && (
        <div className="text-xs text-muted-foreground">
          {from} ~ {to} · {periodLabel}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Followers"
          value={formatNumber(totalFollowers)}
          change={2.8}
          changeLabel={periodLabel}
          icon={<Globe className="h-4 w-4" />}
        />
        <MetricCard
          title="Daily Visitors (GA4)"
          value={formatNumber(latestTraffic.visitors)}
          change={trafficChange}
          changeLabel={periodLabel}
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          title="Daily Pageviews"
          value={formatNumber(latestTraffic.pageviews)}
          change={5.2}
          changeLabel={periodLabel}
        />
        <MetricCard
          title="Avg. Session"
          value="3:24"
          change={1.5}
          changeLabel={periodLabel}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(mergedMetrics).map(([key, ch]) => (
          <MetricCard
            key={key}
            title={ch.name}
            value={formatNumber(ch.followers)}
            change={getChange(key)}
            changeLabel={periodLabel}
            icon={channelIcons[key]}
          />
        ))}
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
            title="Daily Traffic (Last 30 Days)"
            data={trafficData}
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

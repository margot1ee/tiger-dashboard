"use client";

import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  channelMetrics,
  followerTrend,
  trafficData,
} from "@/lib/demo-data";
import { useYouTubeData, useTelegramData } from "@/lib/hooks";
import {
  Mail,
  Linkedin,
  Youtube,
  Send,
  Globe,
  Eye,
  Clock,
} from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelIcons: Record<string, React.ReactNode> = {
  substack: <Mail className="h-4 w-4" />,
  x: <XIcon className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  telegram: <Send className="h-4 w-4" />,
};

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function OverviewPage() {
  const { data: ytData } = useYouTubeData();
  const { data: tgData } = useTelegramData();

  // Merge real data with demo data
  const mergedMetrics = { ...channelMetrics };
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All channels at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Followers"
          value={formatNumber(totalFollowers)}
          change={2.8}
          changeLabel="vs last week"
          icon={<Globe className="h-4 w-4" />}
        />
        <MetricCard
          title="Daily Visitors (GA4)"
          value={formatNumber(latestTraffic.visitors)}
          change={trafficChange}
          changeLabel="vs last week"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          title="Daily Pageviews"
          value={formatNumber(latestTraffic.pageviews)}
          change={5.2}
          changeLabel="vs last week"
        />
        <MetricCard
          title="Avg. Session"
          value="3:24"
          change={1.5}
          changeLabel="vs last week"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(mergedMetrics).map(([key, ch]) => (
          <MetricCard
            key={key}
            title={ch.name}
            value={formatNumber(ch.followers)}
            change={ch.change}
            changeLabel="WoW"
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

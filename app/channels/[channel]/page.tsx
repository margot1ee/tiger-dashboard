"use client";

import { use } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { channelMetrics } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const trend = generateChannelTrend(channel);

  return (
    <div className="space-y-6">
      <Link href="/channels" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Channels
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{metrics.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed analytics for {metrics.name}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Followers"
          value={metrics.followers.toLocaleString()}
          change={metrics.change}
          changeLabel="WoW"
        />
        <MetricCard
          title="Weekly Growth"
          value={`+${Math.floor(metrics.followers * metrics.change / 100)}`}
          change={metrics.change}
        />
        <MetricCard title="Engagement Rate" value="4.2%" change={0.8} changeLabel="WoW" />
        <MetricCard title="Avg. Impressions" value="12.5K" change={3.4} changeLabel="WoW" />
      </div>

      <TrendChart
        title={`${metrics.name} Followers (Last 30 Days)`}
        data={trend}
        lines={[
          { dataKey: "followers", color: metrics.color, name: "Followers" },
        ]}
        height={350}
      />

      <TrendChart
        title="Daily Engagements"
        data={trend}
        lines={[
          { dataKey: "engagements", color: "#22c55e", name: "Engagements" },
        ]}
        height={250}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect API or enter data manually to see post-level analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

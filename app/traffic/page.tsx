"use client";

import { useState, useMemo } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { useGA4Data, useSearchConsoleData } from "@/lib/hooks";
import {
  trafficData as demoTraffic,
  trafficSources as demoSources,
  popularPages as demoPages,
  searchKeywords as demoKeywords,
  searchTrend as demoSearchTrend,
  regionData as demoRegions,
} from "@/lib/demo-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MousePointerClick, Hash, Loader2, Calendar } from "lucide-react";

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

type PeriodKey = "7D" | "4W" | "3M" | "6M" | "1Y" | "custom";

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
    case "6M":
      from.setMonth(from.getMonth() - 6);
      break;
    case "1Y":
      from.setFullYear(from.getFullYear() - 1);
      break;
  }

  return { from: from.toISOString().split("T")[0], to: toStr };
}

function getPrevRange(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const duration = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return {
    prevFrom: prevFrom.toISOString().split("T")[0],
    prevTo: prevTo.toISOString().split("T")[0],
  };
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

function calcChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export default function TrafficPage() {
  const [period, setPeriod] = useState<PeriodKey>("4W");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const { prevFrom, prevTo } = useMemo(() => getPrevRange(from, to), [from, to]);

  const { data: ga4, loading: ga4Loading } = useGA4Data(from, to);
  const { data: ga4Prev } = useGA4Data(prevFrom, prevTo);
  const { data: gsc, loading: gscLoading } = useSearchConsoleData(from, to);
  const { data: gscPrev } = useSearchConsoleData(prevFrom, prevTo);

  const isLive = !!ga4 || !!gsc;
  const periodLabel = getPeriodLabel(period);

  // Use real data if available, fallback to demo
  const trafficData = ga4?.daily || demoTraffic;
  const trafficSources = ga4?.sources || demoSources;
  const popularPages = ga4?.pages || demoPages;
  const regionData = ga4?.regions || demoRegions;
  const searchTrend = gsc?.daily || demoSearchTrend;
  const searchKeywords = gsc?.keywords || demoKeywords;

  const totalVisitors = ga4?.summary.totalVisitors || 28400;
  const totalPageviews = ga4?.summary.totalPageviews || 45200;
  const totalImpressions = gsc?.summary.totalImpressions || 186000;
  const totalClicks = gsc?.summary.totalClicks || 12800;

  const prevVisitors = ga4Prev?.summary?.totalVisitors ?? 0;
  const prevPageviews = ga4Prev?.summary?.totalPageviews ?? 0;
  const prevImpressions = gscPrev?.summary?.totalImpressions ?? 0;
  const prevClicks = gscPrev?.summary?.totalClicks ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Traffic Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              GA4 & Search Console data
            </p>
          </div>
          {(ga4Loading || gscLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isLive && (
            <Badge className="bg-green-100 text-green-700 text-[10px]">LIVE</Badge>
          )}
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

      {/* Period info */}
      <div className="text-xs text-muted-foreground">
        {from} ~ {to} · {periodLabel}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Visitors"
          value={formatNumber(totalVisitors)}
          change={calcChange(totalVisitors, prevVisitors)}
          changeLabel={periodLabel}
        />
        <MetricCard
          title="Pageviews"
          value={formatNumber(totalPageviews)}
          change={calcChange(totalPageviews, prevPageviews)}
          changeLabel={periodLabel}
        />
        <MetricCard
          title="Search Impressions"
          value={formatNumber(totalImpressions)}
          change={calcChange(totalImpressions, prevImpressions)}
          changeLabel={periodLabel}
          icon={<Search className="h-4 w-4" />}
        />
        <MetricCard
          title="Search Clicks"
          value={formatNumber(totalClicks)}
          change={calcChange(totalClicks, prevClicks)}
          changeLabel={periodLabel}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
      </div>

      {/* Traffic trend + Sources */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart
            title="Daily Traffic"
            data={trafficData}
            lines={[
              { dataKey: "visitors", color: "#f97316", name: "Visitors" },
              { dataKey: "pageviews", color: "#3b82f6", name: "Pageviews" },
            ]}
          />
        </div>
        <DonutChart title="Traffic Sources" data={trafficSources} />
      </div>

      {/* Search trend + Region */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart
            title="Search Performance"
            data={searchTrend}
            lines={[
              { dataKey: "impressions", color: "#8b5cf6", name: "Impressions" },
              { dataKey: "clicks", color: "#22c55e", name: "Clicks" },
            ]}
          />
        </div>
        <DonutChart title="Traffic by Region" data={regionData} />
      </div>

      {/* Popular Pages */}
      <BarChart
        title="Top Pages by Pageviews"
        data={popularPages}
        dataKey="pageviews"
        nameKey="name"
        layout="vertical"
        height={400}
      />

      {/* Search Keywords Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Top Search Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Avg. Position</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchKeywords.map((kw) => (
                <TableRow key={kw.keyword}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell className="text-right">{kw.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{kw.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={kw.position <= 3 ? "default" : "secondary"}>
                      #{kw.position.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{kw.ctr}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

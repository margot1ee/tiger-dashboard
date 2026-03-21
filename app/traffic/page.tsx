"use client";

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
import { Search, MousePointerClick, Hash, Loader2 } from "lucide-react";

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function TrafficPage() {
  const { data: ga4, loading: ga4Loading } = useGA4Data();
  const { data: gsc, loading: gscLoading } = useSearchConsoleData();

  const isLive = !!ga4 || !!gsc;

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

  return (
    <div className="space-y-6">
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Monthly Visitors" value={formatNumber(totalVisitors)} />
        <MetricCard title="Pageviews" value={formatNumber(totalPageviews)} />
        <MetricCard title="Search Impressions" value={formatNumber(totalImpressions)} icon={<Search className="h-4 w-4" />} />
        <MetricCard title="Search Clicks" value={formatNumber(totalClicks)} icon={<MousePointerClick className="h-4 w-4" />} />
      </div>

      {/* Traffic trend + Sources */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart
            title="Daily Traffic (Last 30 Days)"
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
            title="Search Performance (Last 30 Days)"
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

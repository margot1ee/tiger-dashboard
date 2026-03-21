"use client";

import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  trafficData,
  trafficSources,
  popularPages,
  searchKeywords,
  searchTrend,
  regionData,
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
import { Search, MousePointerClick, Hash, TrendingUp } from "lucide-react";

export default function TrafficPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Traffic Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          GA4 & Search Console data
        </p>
      </div>

      {/* GA4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Monthly Visitors" value="28.4K" change={8.3} changeLabel="vs last month" />
        <MetricCard title="Pageviews" value="45.2K" change={12.1} changeLabel="vs last month" />
        <MetricCard title="Search Impressions" value="186K" change={15.4} changeLabel="vs last month" icon={<Search className="h-4 w-4" />} />
        <MetricCard title="Search Clicks" value="12.8K" change={9.7} changeLabel="vs last month" icon={<MousePointerClick className="h-4 w-4" />} />
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

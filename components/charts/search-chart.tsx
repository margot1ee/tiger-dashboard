"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SearchChartProps {
  title: string;
  data: Record<string, unknown>[];
  xAxisKey?: string;
  height?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const impressions = payload.find((p: any) => p.dataKey === "impressions");
  const clicks = payload.find((p: any) => p.dataKey === "clicks");
  const ctr = payload.find((p: any) => p.dataKey === "ctr");

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {impressions && (
        <p style={{ color: "#8b5cf6", margin: "2px 0" }}>
          Impressions: {Number(impressions.value).toLocaleString()}
        </p>
      )}
      {clicks && (
        <p style={{ color: "#22c55e", margin: "2px 0" }}>
          Clicks: {Number(clicks.value).toLocaleString()}
        </p>
      )}
      {ctr && (
        <p style={{ color: "#f97316", margin: "2px 0", fontWeight: 600 }}>
          CTR: {ctr.value}%
        </p>
      )}
    </div>
  );
}

export function SearchChart({
  title,
  data,
  xAxisKey = "date",
  height = 300,
}: SearchChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {/* Left axis: Impressions */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
            />
            {/* Right axis: Clicks */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            {/* Impressions: area + line on left axis */}
            <Area
              type="monotone"
              dataKey="impressions"
              stroke="#8b5cf6"
              fill="url(#impressionsFill)"
              name="Impressions"
              strokeWidth={2}
              yAxisId="left"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Clicks: line on right axis */}
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#22c55e"
              name="Clicks"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              yAxisId="right"
            />

            {/* CTR: hidden from chart, only shows in tooltip */}
            <Line
              type="monotone"
              dataKey="ctr"
              stroke="transparent"
              name="CTR %"
              strokeWidth={0}
              dot={false}
              activeDot={false}
              legendType="none"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

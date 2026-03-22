"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {/* Left axis: Impressions (larger scale) */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
            />
            {/* Right axis: Clicks (scaled up so clicks appear lower than impressions) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 3)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            {/* Impressions: line on left axis */}
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="#8b5cf6"
              name="Impressions"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              yAxisId="left"
            />

            {/* Clicks: line on right axis */}
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#22c55e"
              name="Clicks"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              yAxisId="right"
            />

            {/* CTR: hidden, only in tooltip */}
            <Line
              type="monotone"
              dataKey="ctr"
              stroke="transparent"
              strokeWidth={0}
              dot={false}
              activeDot={false}
              legendType="none"
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

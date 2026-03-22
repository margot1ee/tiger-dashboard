"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
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
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {/* Left axis: Impressions */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              label={{ value: "Impressions", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#9ca3af" } }}
            />
            {/* Right axis: Clicks & CTR */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              label={{ value: "Clicks / CTR %", angle: 90, position: "insideRight", style: { fontSize: 11, fill: "#9ca3af" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
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

            {/* Clicks: bar on right axis */}
            <Bar
              dataKey="clicks"
              fill="#22c55e"
              name="Clicks"
              yAxisId="right"
              barSize={12}
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />

            {/* CTR: dashed line on right axis */}
            <Line
              type="monotone"
              dataKey="ctr"
              stroke="#f97316"
              name="CTR %"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              yAxisId="right"
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

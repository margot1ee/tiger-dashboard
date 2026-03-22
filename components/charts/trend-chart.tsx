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

interface LineConfig {
  dataKey: string;
  color: string;
  name: string;
  yAxisId?: "left" | "right";
  strokeDasharray?: string;
}

interface TrendChartProps {
  title: string;
  data: Record<string, unknown>[];
  lines: LineConfig[];
  xAxisKey?: string;
  height?: number;
  dualAxis?: boolean;
  rightAxisLabel?: string;
  leftAxisLabel?: string;
}

export function TrendChart({
  title,
  data,
  lines,
  xAxisKey = "date",
  height = 300,
  dualAxis = false,
  rightAxisLabel,
  leftAxisLabel,
}: TrendChartProps) {
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
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              label={leftAxisLabel ? { value: leftAxisLabel, angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#9ca3af" } } : undefined}
            />
            {dualAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={rightAxisLabel ? { value: rightAxisLabel, angle: 90, position: "insideRight", style: { fontSize: 11, fill: "#9ca3af" } } : undefined}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                name={line.name}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                yAxisId={line.yAxisId || "left"}
                strokeDasharray={line.strokeDasharray}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

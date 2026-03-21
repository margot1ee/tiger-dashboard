"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarChartProps {
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey?: string;
  color?: string;
  height?: number;
  layout?: "vertical" | "horizontal";
}

export function BarChart({
  title,
  data,
  dataKey,
  nameKey = "name",
  color = "#f97316",
  height = 300,
  layout = "horizontal",
}: BarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={
              layout === "vertical"
                ? { left: 120, right: 20, top: 5, bottom: 5 }
                : undefined
            }
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            {layout === "vertical" ? (
              <>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey={nameKey}
                  tick={{ fontSize: 11 }}
                  width={110}
                />
              </>
            ) : (
              <>
                <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

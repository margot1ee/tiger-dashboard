"use client";

import { contentPerformance } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";

const channelColors: Record<string, string> = {
  Substack: "bg-orange-100 text-orange-700",
  X: "bg-gray-100 text-gray-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  YouTube: "bg-red-100 text-red-700",
  Telegram: "bg-cyan-100 text-cyan-700",
};

export default function ContentPage() {
  const sorted = [...contentPerformance].sort((a, b) => b.views - a.views);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All content across channels, ranked by views
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {(sorted.reduce((s, c) => s + c.views, 0) / 1000).toFixed(1)}K
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {(sorted.reduce((s, c) => s + c.likes + c.comments + c.shares, 0) / 1000).toFixed(1)}K
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Posts This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{sorted.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Avg. Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">4.8%</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">
                  <Eye className="h-3.5 w-3.5 inline mr-1" />Views
                </TableHead>
                <TableHead className="text-right">
                  <Heart className="h-3.5 w-3.5 inline mr-1" />Likes
                </TableHead>
                <TableHead className="text-right">
                  <MessageCircle className="h-3.5 w-3.5 inline mr-1" />Comments
                </TableHead>
                <TableHead className="text-right">
                  <Share2 className="h-3.5 w-3.5 inline mr-1" />Shares
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item, i) => (
                <TableRow key={i} className={i === 0 ? "bg-orange-50/50" : ""}>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={channelColors[item.channel]}>
                      {item.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{item.likes.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.comments}</TableCell>
                  <TableCell className="text-right">{item.shares}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

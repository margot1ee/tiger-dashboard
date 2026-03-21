"use client";

import { weeklyInsights } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Zap,
  FileText,
  AlertTriangle,
  Hash,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useState } from "react";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  growth: { icon: <TrendingUp className="h-4 w-4" />, color: "bg-green-100 text-green-700", label: "Growth" },
  spike: { icon: <Zap className="h-4 w-4" />, color: "bg-blue-100 text-blue-700", label: "Traffic" },
  content: { icon: <FileText className="h-4 w-4" />, color: "bg-orange-100 text-orange-700", label: "Content" },
  alert: { icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-700", label: "Alert" },
  keyword: { icon: <Hash className="h-4 w-4" />, color: "bg-purple-100 text-purple-700", label: "SEO" },
};

export default function InsightsPage() {
  const [copied, setCopied] = useState(false);

  const markdownSummary = weeklyInsights
    .map((ins) => `- **${ins.title}**: ${ins.detail}`)
    .join("\n");

  const fullMarkdown = `## Weekly Insights - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n### Key Changes\n${markdownSummary}\n\n### Discussion Points\n- Which content topics should we double down on?\n- Action items for declining LinkedIn engagement\n- SEO keyword strategy for next week`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generated summary for weekly meeting
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <CheckCheck className="h-4 w-4 mr-1.5" />
          ) : (
            <Copy className="h-4 w-4 mr-1.5" />
          )}
          {copied ? "Copied!" : "Copy as Markdown"}
        </Button>
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        {weeklyInsights.map((insight, i) => {
          const config = typeConfig[insight.type];
          return (
            <Card key={i}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`p-2 rounded-lg shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {insight.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Markdown Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Meeting Notes Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
            {fullMarkdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

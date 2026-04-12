"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Hash,
  Copy,
  CheckCheck,
  Eye,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useChannelSheet, useSubstackStats, useYouTubeAnalytics, useSearchConsoleData } from "@/lib/hooks";

interface Insight {
  type: "growth" | "spike" | "decline" | "alert" | "keyword";
  title: string;
  detail: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  growth: { icon: <TrendingUp className="h-4 w-4" />, color: "bg-green-100 text-green-700", label: "Growth" },
  spike: { icon: <Zap className="h-4 w-4" />, color: "bg-blue-100 text-blue-700", label: "Spike" },
  decline: { icon: <TrendingDown className="h-4 w-4" />, color: "bg-orange-100 text-orange-700", label: "Decline" },
  alert: { icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-700", label: "Alert" },
  keyword: { icon: <Hash className="h-4 w-4" />, color: "bg-purple-100 text-purple-700", label: "SEO" },
};

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function InsightsPage() {
  const [copied, setCopied] = useState(false);
  const { data: channelSheet } = useChannelSheet();
  const { data: substackStats } = useSubstackStats(7);
  const { data: ytAnalytics } = useYouTubeAnalytics(7);
  const { data: searchData } = useSearchConsoleData();

  const insights = useMemo(() => {
    const list: Insight[] = [];

    // Channel sheet insights
    if (channelSheet?.channels) {
      for (const [key, ch] of Object.entries(channelSheet.channels)) {
        const name = key === "x" ? "X (Twitter)" : key === "telegram" ? "Telegram" : key === "linkedin" ? "LinkedIn" : key === "xiaohongshu" ? "小红书" : key === "instagram_id" ? "Instagram (ID)" : key === "x_jp" ? "X (JP)" : key === "youtube" ? "YouTube" : key === "substack" ? "Substack" : key;

        // Significant follower growth (>5%)
        if (ch.followersChangePercent > 5) {
          list.push({
            type: "growth",
            title: `${name} 팔로워 +${ch.followersChange}명 (${ch.followersChangePercent}%)`,
            detail: `${formatNumber(ch.prevFollowers)} → ${formatNumber(ch.followers)}. 높은 성장률 유지 중`,
          });
        }

        // Follower decline
        if (ch.followersChange < -20) {
          list.push({
            type: "alert",
            title: `${name} 팔로워 ${ch.followersChange}명 감소`,
            detail: `${formatNumber(ch.prevFollowers)} → ${formatNumber(ch.followers)} (${ch.followersChangePercent}% WoW). 리텐션 전략 검토 필요`,
          });
        }

        // Impression spike (>100%)
        if (ch.impressionsChangePercent > 100) {
          list.push({
            type: "spike",
            title: `${name} 임프레션 +${ch.impressionsChangePercent}% 급증`,
            detail: `${formatNumber(ch.prevImpressions)} → ${formatNumber(ch.impressions)}. 바이럴 콘텐츠 또는 외부 유입 확인 필요`,
          });
        }

        // Impression decline (>-50%)
        if (ch.impressionsChangePercent < -50 && ch.prevImpressions > 100) {
          list.push({
            type: "decline",
            title: `${name} 임프레션 ${ch.impressionsChangePercent}% 급감`,
            detail: `${formatNumber(ch.prevImpressions)} → ${formatNumber(ch.impressions)}. 콘텐츠 빈도 또는 알고리즘 변화 점검 필요`,
          });
        }

        // Impressions up but followers down
        if (ch.impressionsChangePercent > 20 && ch.followersChange < 0) {
          list.push({
            type: "spike",
            title: `${name} 임프레션↑ but 팔로워↓ 불일치`,
            detail: `임프레션 +${ch.impressionsChangePercent}%이나 팔로워 ${ch.followersChange}명 감소. 비구독자 유입 증가 → 전환 기회`,
          });
        }
      }
    }

    // Substack specific
    if (substackStats) {
      if (substackStats.openRate < 20) {
        list.push({
          type: "alert",
          title: `Substack 오픈율 ${substackStats.openRate}%로 하락`,
          detail: `오픈율 변동: ${substackStats.openRateDiff > 0 ? "+" : ""}${substackStats.openRateDiff}%p. 제목 최적화 또는 발송 시간 조정 검토`,
        });
      }
      if (substackStats.subsGained > 0 && substackStats.subsLost > substackStats.subsGained * 2) {
        list.push({
          type: "alert",
          title: `Substack 이탈(${substackStats.subsLost})이 신규(${substackStats.subsGained})의 2배 이상`,
          detail: `순 변동 ${substackStats.subscribersChange}명. 콘텐츠 주제 다양화 또는 리텐션 캠페인 검토 필요`,
        });
      }
    }

    // YouTube specific
    if (ytAnalytics) {
      if (ytAnalytics.viewsChangePercent > 50) {
        list.push({
          type: "growth",
          title: `YouTube 조회수 +${ytAnalytics.viewsChangePercent}% (${formatNumber(ytAnalytics.views)})`,
          detail: `이전 주 ${formatNumber(ytAnalytics.prevViews)} → ${formatNumber(ytAnalytics.views)}. 구독자 +${ytAnalytics.netSubscribers}명 (↑${ytAnalytics.subscribersGained} ↓${ytAnalytics.subscribersLost})`,
        });
      }
    }

    // Search Console - find anomalies
    if (searchData?.daily) {
      const avgImp = searchData.daily.reduce((s, d) => s + d.impressions, 0) / searchData.daily.length;
      for (const day of searchData.daily) {
        if (day.impressions > avgImp * 2.5) {
          list.push({
            type: "keyword",
            title: `서치 임프레션 급증 (${day.date}: ${formatNumber(day.impressions)})`,
            detail: `평균 ${formatNumber(Math.round(avgImp))} 대비 ${(day.impressions / avgImp).toFixed(1)}배. 트렌딩 키워드 유입 가능성`,
          });
        }
      }

      // Top keywords insight
      if (searchData.keywords?.length > 0) {
        const topKeyword = searchData.keywords[0];
        list.push({
          type: "keyword",
          title: `Top 검색 키워드: "${topKeyword.keyword}"`,
          detail: `노출 ${formatNumber(topKeyword.impressions)} / 클릭 ${topKeyword.clicks} / CTR ${(topKeyword.ctr * 100).toFixed(1)}% / 평균 순위 ${topKeyword.position.toFixed(1)}`,
        });
      }
    }

    // Sort: alerts first, then spikes, then growth
    const priority: Record<string, number> = { alert: 0, spike: 1, decline: 2, keyword: 3, growth: 4 };
    list.sort((a, b) => (priority[a.type] ?? 5) - (priority[b.type] ?? 5));

    if (list.length === 0) {
      list.push({
        type: "growth",
        title: "안정적인 주간",
        detail: "모든 지표가 안정적인 범위 내에서 유지되고 있습니다.",
      });
    }

    return list;
  }, [channelSheet, substackStats, ytAnalytics, searchData]);

  const markdownSummary = insights
    .map((ins) => `- **[${ins.type.toUpperCase()}]** ${ins.title}: ${ins.detail}`)
    .join("\n");

  const fullMarkdown = `## Weekly Insights - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n${markdownSummary}`;

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
            Auto-generated from live channel data
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Insights</p>
              <p className="text-lg font-bold">{insights.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Alerts</p>
              <p className="text-lg font-bold">{insights.filter(i => i.type === "alert" || i.type === "decline").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Positive</p>
              <p className="text-lg font-bold">{insights.filter(i => i.type === "growth" || i.type === "spike").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        {insights.map((insight, i) => {
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

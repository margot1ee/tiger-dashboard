"use client";

import { useState, useMemo } from "react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  channelMetrics,
  followerTrend,
  trafficData,
  trafficSources,
} from "@/lib/demo-data";
import { useYouTubeData, useYouTubeAnalytics, useTelegramData, useXData, useChannelMetrics, useComparisonMetrics, useGA4Data, useTelegramPosts, useSubstackStats, useChannelSheet, useSubstackSheet, useSubstackSubscribers } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Eye,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { XiaohongshuIcon } from "@/components/icons/xiaohongshu-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const channelIcons: Record<string, React.ReactNode> = {
  substack: <SubstackIcon className="h-5 w-5" />,
  x: <XIcon className="h-5 w-5" />,
  linkedin: <LinkedInIcon className="h-5 w-5" />,
  youtube: <YouTubeIcon className="h-5 w-5" />,
  telegram: <TelegramIcon className="h-5 w-5" />,
  xiaohongshu: <span className="flex items-center gap-0.5"><XiaohongshuIcon className="h-5 w-5 text-[#FF2442]" /><span className="text-[10px]">🇨🇳</span></span>,
  instagram_id: <span className="flex items-center gap-0.5"><InstagramIcon className="h-5 w-5 text-[#E4405F]" /><span className="text-[10px]">🇮🇩</span></span>,
  x_jp: <span className="flex items-center gap-0.5"><XIcon className="h-5 w-5" /><span className="text-[10px]">🇯🇵</span></span>,
};

const channelColors: Record<string, string> = {
  substack: "",
  x: "",
  linkedin: "",
  youtube: "",
  telegram: "",
  xiaohongshu: "",
  instagram_id: "",
  x_jp: "",
};

const channelOrder = ["substack", "x", "linkedin", "youtube", "telegram", "xiaohongshu", "instagram_id", "x_jp"];

type PeriodKey = "7D" | "4W" | "3M" | "6M" | "1Y" | "custom";

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function getDateRange(period: PeriodKey, customFrom?: string, customTo?: string) {
  const to = new Date();
  const toStr = to.toISOString().split("T")[0];
  if (period === "custom" && customFrom && customTo) return { from: customFrom, to: customTo };
  const from = new Date();
  switch (period) {
    case "7D": from.setDate(from.getDate() - 7); break;
    case "4W": from.setDate(from.getDate() - 28); break;
    case "3M": from.setMonth(from.getMonth() - 3); break;
    case "6M": from.setMonth(from.getMonth() - 6); break;
    case "1Y": from.setFullYear(from.getFullYear() - 1); break;
  }
  return { from: from.toISOString().split("T")[0], to: toStr };
}

function getPeriodLabel(period: PeriodKey) {
  switch (period) {
    case "7D": return "vs prev 7 days";
    case "4W": return "vs prev 4 weeks";
    case "3M": return "vs prev 3 months";
    case "6M": return "vs prev 6 months";
    case "1Y": return "vs prev year";
    case "custom": return "vs prev period";
  }
}

function getPeriodDays(period: PeriodKey, customFrom?: string, customTo?: string): number {
  switch (period) {
    case "7D": return 7;
    case "4W": return 28;
    case "3M": return 90;
    case "6M": return 180;
    case "1Y": return 365;
    case "custom": {
      if (customFrom && customTo) {
        return Math.ceil((new Date(customTo).getTime() - new Date(customFrom).getTime()) / (1000 * 60 * 60 * 24));
      }
      return 30;
    }
  }
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<PeriodKey>("7D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const { data: ytData } = useYouTubeData();
  const { data: tgData } = useTelegramData();
  const { data: xData } = useXData();
  const { data: xJpData } = useXData("tr_japan_");
  const { data: tgPosts } = useTelegramPosts();
  const periodDays = useMemo(() => getPeriodDays(period, customFrom, customTo), [period, customFrom, customTo]);
  const { data: substackStats } = useSubstackStats(periodDays);
  const { data: ytAnalytics } = useYouTubeAnalytics(periodDays);
  const { data: channelSheet } = useChannelSheet();
  const { data: substackSheet } = useSubstackSheet(periodDays);
  const { data: substackSubs } = useSubstackSubscribers(periodDays);
  const { data: dbMetrics } = useChannelMetrics(true);
  const { comparisons, prevFromStr, prevToStr } = useComparisonMetrics(from, to);
  const { data: ga4Data } = useGA4Data(from, to);
  const { data: ga4PrevData } = useGA4Data(prevFromStr, prevToStr);

  const mergedMetrics: Record<string, {
    name: string; followers: number; change: number; color: string;
    impressions: number; impressionsChange: number;
    followersDetail?: string; impressionsDetail?: string; followersRaw?: number;
  }> = { ...channelMetrics };
  // Substack: live subscribers + period views from internal API
  if (substackStats) {
    mergedMetrics.substack = {
      ...mergedMetrics.substack,
      followers: substackStats.subscribers,
      impressions: substackStats.views,
      impressionsChange: substackStats.viewsChangePercent,
      followersRaw: substackStats.subscribers,
      impressionsDetail: `prev ${formatNumber(substackStats.prevViews)}`,
    };
  }
  // Substack subscribers: prefer API, fallback to sheet
  if (substackSubs) {
    const net = substackSubs.netChange;
    mergedMetrics.substack = {
      ...mergedMetrics.substack,
      followers: substackSubs.totalSubscribers,
      followersRaw: substackSubs.totalSubscribers,
      followersDetail: `${net >= 0 ? "+" : ""}${net}, ↑${substackSubs.gained} ↓${substackSubs.lost}`,
    };
  } else if (substackSheet) {
    const net = substackSheet.netChange;
    mergedMetrics.substack = {
      ...mergedMetrics.substack,
      followersDetail: `${net >= 0 ? "+" : ""}${net}, ↑${substackSheet.gained} ↓${substackSheet.lost}`,
    };
  }
  // YouTube: live subscribers + Analytics API for period views
  // Only use ytData.channel.totalViews as a LAST resort (it's lifetime total, not period)
  if (ytData) {
    const ytNetSubs = ytAnalytics?.netSubscribers;
    const ytSubsGained = ytAnalytics?.subscribersGained;
    const ytSubsLost = ytAnalytics?.subscribersLost;
    mergedMetrics.youtube = {
      ...mergedMetrics.youtube,
      followers: ytData.channel.subscribers,
      // Prefer period views from Analytics API; if unavailable, leave impressions to be set by sheet override below
      ...(ytAnalytics?.views ? { impressions: ytAnalytics.views, impressionsChange: ytAnalytics.viewsChangePercent ?? 0 } : {}),
      ...(ytNetSubs !== undefined ? {
        followersDetail: `${ytNetSubs >= 0 ? "+" : ""}${ytNetSubs} (↑${ytSubsGained} ↓${ytSubsLost})`,
        impressionsDetail: `prev ${formatNumber(ytAnalytics?.prevViews ?? 0)}`,
      } : {}),
    };
  }
  // Telegram: live members + post views filtered by period
  if (tgData) {
    const filteredTgPosts = tgPosts?.posts?.filter((p) => p.date >= from && p.date <= to) ?? [];
    const tgImpressions = filteredTgPosts.reduce((s, p) => s + (p.views ?? 0), 0);
    mergedMetrics.telegram = {
      ...mergedMetrics.telegram,
      followers: tgData.channel.members,
      ...(tgImpressions > 0
        ? {
            impressions: tgImpressions,
            impressionsChange: 0,
            // Set impressionsDetail so sheet override won't overwrite our live data
            impressionsDetail: `${filteredTgPosts.length} posts`,
          }
        : {}),
    };
  }
  // X: live followers + tweet impressions
  if (xData) {
    const xImpressions = xData.tweets?.reduce((s, t) => s + (t.metrics?.impressions ?? 0), 0) ?? 0;
    mergedMetrics.x = {
      ...mergedMetrics.x,
      followers: xData.user.followers,
      ...(xImpressions > 0 ? { impressions: xImpressions } : {}),
    };
  }
  // X Japan: live data
  if (xJpData) {
    const xJpImpressions = xJpData.tweets?.reduce((s, t) => s + (t.metrics?.impressions ?? 0), 0) ?? 0;
    mergedMetrics.x_jp = {
      ...mergedMetrics.x_jp,
      followers: xJpData.user.followers,
      ...(xJpImpressions > 0 ? { impressions: xJpImpressions } : {}),
    };
  }
  if (dbMetrics?.metrics) {
    for (const row of dbMetrics.metrics) {
      const key = row.channel as string;
      if (mergedMetrics[key] && row.followers != null) mergedMetrics[key] = { ...mergedMetrics[key], followers: row.followers };
    }
  }
  // Channel Sheet: fill in channels not yet connected via API
  if (channelSheet?.channels) {
    // Sheet is the source of truth ONLY for channels without a live API.
    // Substack / YouTube / Telegram have their own real-time integrations
    // and should never be overwritten by stale sheet values.
    const sheetOnlyChannels = ["x", "linkedin", "xiaohongshu", "instagram_id", "x_jp"];
    for (const key of sheetOnlyChannels) {
      const sh = channelSheet.channels[key];
      if (!sh || !mergedMetrics[key]) continue;
      const current = mergedMetrics[key];
      // Preserve existing rich impressions/followers details from live APIs (e.g. YouTube Analytics)
      const hasLiveImpressions = (current.impressions ?? 0) > 0 && current.impressionsDetail;
      const hasLiveFollowerDetail = !!current.followersDetail && current.followersDetail.includes("↑");
      mergedMetrics[key] = {
        ...current,
        followers: sh.followers || current.followers,
        change: sh.followersChangePercent || current.change,
        impressions: hasLiveImpressions ? current.impressions : sh.impressions,
        impressionsChange: hasLiveImpressions ? current.impressionsChange : (sh.impressionsChangePercent || current.impressionsChange),
        followersRaw: sh.followers,
        followersDetail: hasLiveFollowerDetail
          ? current.followersDetail
          : (sh.followersChange !== 0 ? `${sh.followersChange >= 0 ? "+" : ""}${sh.followersChange}` : undefined),
        impressionsDetail: hasLiveImpressions
          ? current.impressionsDetail
          : (sh.prevImpressions > 0 ? `prev ${formatNumber(sh.prevImpressions)}` : undefined),
      };
    }
  }

  const getChange = (channelKey: string): number | undefined => {
    const comp = comparisons.find((c) => c.channel === channelKey);
    if (comp?.changePercent != null) return comp.changePercent;
    return mergedMetrics[channelKey as string]?.change;
  };

  const totalFollowers = Object.values(mergedMetrics).reduce((sum, ch) => sum + ch.followers, 0);

  const ga4Visitors = ga4Data?.summary?.totalVisitors ?? trafficData[trafficData.length - 1]?.visitors ?? 0;
  const ga4Pageviews = ga4Data?.summary?.totalPageviews ?? trafficData[trafficData.length - 1]?.pageviews ?? 0;
  const ga4PrevVisitors = ga4PrevData?.summary?.totalVisitors ?? 0;
  const ga4PrevPageviews = ga4PrevData?.summary?.totalPageviews ?? 0;

  // Total impressions from all channels (CSV data in channelMetrics)
  const totalImpressions = Object.values(mergedMetrics).reduce(
    (sum, ch) => sum + ((ch as { impressions?: number }).impressions ?? 0), 0
  );

  // Weighted average WoW for impressions
  const channelsWithImpressions = Object.values(mergedMetrics).filter(
    (ch) => ((ch as { impressions?: number }).impressions ?? 0) > 0
  );
  const totalImpressionsWoW = channelsWithImpressions.length > 0
    ? Math.round(
        channelsWithImpressions.reduce((sum, ch) => {
          const imp = (ch as { impressions?: number }).impressions ?? 0;
          const change = (ch as { impressionsChange?: number }).impressionsChange ?? 0;
          return sum + imp * change;
        }, 0) / totalImpressions * 10
      ) / 10
    : undefined;

  const visitorsChange = ga4PrevVisitors > 0 ? Math.round(((ga4Visitors - ga4PrevVisitors) / ga4PrevVisitors) * 1000) / 10 : 0;
  const pageviewsChange = ga4PrevPageviews > 0 ? Math.round(((ga4Pageviews - ga4PrevPageviews) / ga4PrevPageviews) * 1000) / 10 : 0;

  const avgSessionSeconds = ga4Data?.daily?.length ? ga4Data.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4Data.daily.length : 204;
  const avgMins = Math.floor(avgSessionSeconds / 60);
  const avgSecs = Math.round(avgSessionSeconds % 60);
  const avgSessionStr = `${avgMins}:${String(avgSecs).padStart(2, "0")}`;
  const prevAvgSession = ga4PrevData?.daily?.length ? ga4PrevData.daily.reduce((s, d) => s + d.avgSessionDuration, 0) / ga4PrevData.daily.length : 0;
  const sessionChange = prevAvgSession > 0 ? Math.round(((avgSessionSeconds - prevAvgSession) / prevAvgSession) * 1000) / 10 : 0;

  const chartTrafficData = ga4Data?.daily ?? trafficData;
  const periodLabel = getPeriodLabel(period);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All channels at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["7D", "4W", "3M", "6M", "1Y", "custom"] as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "custom" ? "Custom" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">From</span>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          <span className="text-muted-foreground">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          {customFrom && customTo && <span className="text-xs text-muted-foreground">comparing with {prevFromStr} ~ {prevToStr}</span>}
        </div>
      )}

      {period !== "custom" && (
        <div className="text-xs text-muted-foreground -mt-4">{from} ~ {to} · {periodLabel}</div>
      )}

      {/* ── Website Traffic ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-orange-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Website Traffic</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetricCard title="Visitors" value={formatNumber(ga4Visitors)} change={visitorsChange} changeLabel={periodLabel} icon={<Eye className="h-4 w-4" />} />
          <MetricCard title="Pageviews" value={formatNumber(ga4Pageviews)} change={pageviewsChange} changeLabel={periodLabel} icon={<Globe className="h-4 w-4" />} />
          <MetricCard title="Avg. Session" value={avgSessionStr} change={sessionChange} changeLabel={periodLabel} icon={<Clock className="h-4 w-4" />} />
        </div>

        {/* Traffic Sources Bar Chart */}
        <BarChart
          title="Traffic by Source / Medium"
          data={(ga4Data?.sources ?? trafficSources).map(s => ({ ...s, name: s.name }))}
          dataKey="value"
          nameKey="name"
          color="#f97316"
          height={280}
        />
      </section>

      {/* ── Substack Subscribers ── */}
      {(substackSubs || substackSheet) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 bg-[#FF6719] rounded-full" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Substack Subscribers</h2>
          </div>

          {/* Summary cards */}
          {(() => {
            const net = substackSubs?.netChange ?? substackSheet?.netChange ?? 0;
            const g = substackSubs?.gained ?? substackSheet?.gained ?? 0;
            const l = substackSubs?.lost ?? substackSheet?.lost ?? 0;
            const prevG = substackSheet?.prevGained;
            const prevL = substackSheet?.prevLost;
            const gPct = substackSheet?.gainedChangePercent;
            const lPct = substackSheet?.lostChangePercent;
            const nPct = substackSheet?.netChangePercent;
            const prevNet = substackSheet?.prevNetChange;
            return (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{(substackSubs?.totalSubscribers ?? mergedMetrics.substack.followers).toLocaleString()}</p>
                </div>
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground">Net Change ({periodDays}d)</p>
                  <p className={`text-2xl font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {net >= 0 ? "+" : ""}{net}
                  </p>
                  {nPct != null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      prev {prevNet != null ? (prevNet >= 0 ? `+${prevNet}` : prevNet) : "—"}
                      {" · "}
                      <span className={nPct > 0 ? "text-green-600" : nPct < 0 ? "text-red-500" : ""}>
                        {nPct > 0 ? "+" : ""}{nPct}%
                      </span>
                    </p>
                  )}
                </div>
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground">Gained ↑</p>
                  <p className="text-2xl font-bold text-green-600">{g}</p>
                  {gPct != null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      prev {prevG ?? "—"}
                      {" · "}
                      <span className={gPct > 0 ? "text-green-600" : gPct < 0 ? "text-red-500" : ""}>
                        {gPct > 0 ? "+" : ""}{gPct}%
                      </span>
                    </p>
                  )}
                </div>
                <div className="border rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground">Lost ↓</p>
                  <p className="text-2xl font-bold text-red-500">{l}</p>
                  {lPct != null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      prev {prevL ?? "—"}
                      {" · "}
                      <span className={lPct < 0 ? "text-green-600" : lPct > 0 ? "text-red-500" : ""}>
                        {lPct > 0 ? "+" : ""}{lPct}%
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Source & Country charts */}
          {substackSheet?.sources && substackSheet.sources.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <BarChart
                title="New Subscribers by Source"
                data={substackSheet.sources.slice(0, 10)}
                dataKey="value"
                nameKey="name"
                color="#FF6719"
                height={280}
              />
              <BarChart
                title="New Subscribers by Country"
                data={substackSheet.countries?.slice(0, 10) ?? []}
                dataKey="value"
                nameKey="name"
                color="#3b82f6"
                height={280}
              />
            </div>
          )}
        </section>
      )}

      {/* ── Social Performance ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-blue-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Social Performance</h2>
        </div>

        {/* Total Followers & Impressions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 border rounded-lg px-4 py-2.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Followers</span>
            <span className="text-xl font-bold">{formatNumber(totalFollowers)}</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg px-4 py-2.5">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Impressions</span>
            <span className="text-xl font-bold">{formatNumber(totalImpressions)}</span>
            {totalImpressionsWoW !== undefined && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${totalImpressionsWoW > 0 ? "text-green-600" : totalImpressionsWoW < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {totalImpressionsWoW > 0 && <TrendingUp className="h-3 w-3" />}
                {totalImpressionsWoW < 0 && <TrendingDown className="h-3 w-3" />}
                {totalImpressionsWoW > 0 ? "+" : ""}{totalImpressionsWoW}%
              </span>
            )}
          </div>
        </div>

        {/* Combined Channel Cards: Followers + Impressions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {channelOrder.map((key) => {
            const ch = mergedMetrics[key];
            if (!ch) return null;
            const folChange = getChange(key);
            const folPos = folChange !== undefined && folChange > 0;
            const folNeg = folChange !== undefined && folChange < 0;
            const imp = ch.impressions ?? 0;
            const impChange = ch.impressionsChange ?? 0;
            const impPos = impChange > 0;
            const impNeg = impChange < 0;
            return (
              <Card key={key} className="border transition-all hover:shadow-md">
                <CardContent className="py-4 px-4">
                  {/* Channel header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-white/80 border flex items-center justify-center shadow-sm">
                      {channelIcons[key]}
                    </div>
                    <span className="text-sm font-semibold">{ch.name}</span>
                  </div>

                  {/* Followers row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Followers</span>
                    </div>
                    {folChange !== undefined && (
                      <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${folPos ? "text-green-600" : folNeg ? "text-red-500" : "text-muted-foreground"}`}>
                        {folPos && <TrendingUp className="h-2.5 w-2.5" />}
                        {folNeg && <TrendingDown className="h-2.5 w-2.5" />}
                        {folPos ? "+" : ""}{folChange}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl font-bold tracking-tight">{ch.followersRaw ? ch.followersRaw.toLocaleString() : formatNumber(ch.followers)}</p>
                    {ch.followersDetail && (
                      <span className="text-[10px] text-muted-foreground">({ch.followersDetail})</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed my-2.5" />

                  {/* Impressions row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Impressions</span>
                    </div>
                    {impChange !== 0 && (
                      <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${impPos ? "text-green-600" : impNeg ? "text-red-500" : "text-muted-foreground"}`}>
                        {impPos && <TrendingUp className="h-2.5 w-2.5" />}
                        {impNeg && <TrendingDown className="h-2.5 w-2.5" />}
                        {impPos ? "+" : ""}{impChange}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl font-bold tracking-tight">{imp > 0 ? formatNumber(imp) : "-"}</p>
                    {imp > 0 && ch.impressionsDetail && (
                      <span className="text-[10px] text-muted-foreground">({ch.impressionsDetail})</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Trends ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-1 bg-violet-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Trends</h2>
        </div>
        <Tabs defaultValue="followers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="followers">Follower Trend</TabsTrigger>
            <TabsTrigger value="impressions">Impressions Trend</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Trend</TabsTrigger>
          </TabsList>
          <TabsContent value="followers">
            <TrendChart
              title="Follower Growth (Weekly)"
              data={channelSheet?.followerTrend ?? followerTrend}
              lines={[
                { dataKey: "Substack", color: "#FF6719", name: "Substack" },
                { dataKey: "X (Twitter)", color: "#000000", name: "X" },
                { dataKey: "LinkedIn", color: "#0A66C2", name: "LinkedIn" },
                { dataKey: "Telegram", color: "#26A5E4", name: "Telegram" },
                { dataKey: "Youtube", color: "#FF0000", name: "YouTube" },
                { dataKey: "Xiaohongshu", color: "#FF2442", name: "小红书" },
                { dataKey: "Instagram", color: "#E4405F", name: "Instagram" },
              ]}
              height={350}
            />
          </TabsContent>
          <TabsContent value="impressions">
            <TrendChart
              title="Impressions Trend (Weekly)"
              data={channelSheet?.impressionTrend ?? []}
              lines={[
                { dataKey: "Substack", color: "#FF6719", name: "Substack" },
                { dataKey: "X (Twitter)", color: "#000000", name: "X" },
                { dataKey: "LinkedIn", color: "#0A66C2", name: "LinkedIn" },
                { dataKey: "Telegram", color: "#26A5E4", name: "Telegram" },
                { dataKey: "Youtube", color: "#FF0000", name: "YouTube" },
                { dataKey: "Xiaohongshu", color: "#FF2442", name: "小红书" },
                { dataKey: "Instagram", color: "#E4405F", name: "Instagram" },
              ]}
              height={350}
            />
          </TabsContent>
          <TabsContent value="traffic">
            <TrendChart
              title="Traffic Trend"
              data={chartTrafficData}
              lines={[
                { dataKey: "visitors", color: "#f97316", name: "Visitors" },
                { dataKey: "pageviews", color: "#3b82f6", name: "Pageviews" },
              ]}
              height={350}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

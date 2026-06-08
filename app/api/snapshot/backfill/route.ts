import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function safeFetch<T = unknown>(url: string): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

interface SubstackResp { subscribers?: number; subscribersStart?: number; views?: number; prevViews?: number }
interface YoutubeResp { channel?: { subscribers?: number } }
interface YtAnalyticsResp { views?: number; prevViews?: number; netSubscribers?: number }
interface TelegramResp { channel?: { members?: number } }
interface TgPostsResp { posts?: { date: string; views?: number }[] }
interface ChannelSheetChannel { followers?: number; impressions?: number; prevFollowers?: number; prevImpressions?: number }
interface ChannelSheetResp { channels?: Record<string, ChannelSheetChannel> }

// One-time backfill: write a snapshot row for "7 days ago" using each
// channel's best-available prev value. After this, the cron-saved snapshot
// from today + this backfilled prev gives the dashboard an accurate WoW for
// this week. Future weeks pick up from the cron automatically.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const overrideDate = url.searchParams.get("date"); // YYYY-MM-DD
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://tiger-dashboard-delta.vercel.app";

  const targetDate = overrideDate
    ? overrideDate
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split("T")[0];
      })();

  const results = await Promise.allSettled([
    safeFetch<SubstackResp>(`${base}/api/substack-stats?range=7`),
    safeFetch<YoutubeResp>(`${base}/api/youtube`),
    safeFetch<YtAnalyticsResp>(`${base}/api/youtube-analytics?days=7`),
    safeFetch<TelegramResp>(`${base}/api/telegram`),
    safeFetch<TgPostsResp>(`${base}/api/telegram-posts`),
    safeFetch<ChannelSheetResp>(`${base}/api/channel-sheet`),
  ]);
  const v = <T>(i: number) =>
    results[i].status === "fulfilled" ? ((results[i] as PromiseFulfilledResult<T | null>).value) : null;
  const ss = v<SubstackResp>(0);
  const yt = v<YoutubeResp>(1);
  const ya = v<YtAnalyticsResp>(2);
  const tg = v<TelegramResp>(3);
  const tgp = v<TgPostsResp>(4);
  const cs = v<ChannelSheetResp>(5);

  // Telegram impressions for prev period (the 7 days before today's 7 days)
  const now = new Date();
  const prevWindowEnd = new Date(now);
  prevWindowEnd.setDate(prevWindowEnd.getDate() - 7);
  const prevWindowStart = new Date(prevWindowEnd);
  prevWindowStart.setDate(prevWindowStart.getDate() - 7);
  const prevStartStr = prevWindowStart.toISOString().split("T")[0];
  const prevEndStr = prevWindowEnd.toISOString().split("T")[0];
  const tgPrevImp = (tgp?.posts ?? [])
    .filter((p) => p.date >= prevStartStr && p.date < prevEndStr)
    .reduce((s, p) => s + (p.views ?? 0), 0);

  const rows: {
    channel: string;
    date: string;
    followers: number | null;
    impressions: number | null;
    source: "auto";
  }[] = [
    {
      channel: "substack",
      date: targetDate,
      followers: ss?.subscribersStart ?? null,
      impressions: ss?.prevViews ?? null,
      source: "auto",
    },
    {
      channel: "youtube",
      date: targetDate,
      // prev subs = current - netSubs (if Analytics available); else current
      followers:
        yt?.channel?.subscribers != null
          ? yt.channel.subscribers - (ya?.netSubscribers ?? 0)
          : null,
      impressions: ya?.prevViews ?? null,
      source: "auto",
    },
    {
      channel: "telegram",
      date: targetDate,
      // No historical members API; use current as approximation
      followers: tg?.channel?.members ?? null,
      impressions: tgPrevImp > 0 ? tgPrevImp : null,
      source: "auto",
    },
  ];

  if (cs?.channels) {
    for (const [key, c] of Object.entries(cs.channels)) {
      if (!["x", "linkedin", "xiaohongshu", "instagram_id", "x_jp"].includes(key)) continue;
      rows.push({
        channel: key,
        date: targetDate,
        followers: c.prevFollowers ?? null,
        impressions: c.prevImpressions ?? null,
        source: "auto",
      });
    }
  }

  const validRows = rows.filter((r) => r.followers != null || r.impressions != null);

  // Clear any existing rows for that date+source first
  let deleteError: string | null = null;
  try {
    const del = await supabase
      .from("channel_metrics")
      .delete()
      .eq("date", targetDate)
      .eq("source", "auto");
    deleteError = del.error?.message || null;
  } catch (e) {
    deleteError = e instanceof Error ? e.message : String(e);
  }

  let insertedData: unknown[] | null = null;
  let insertError: string | null = null;
  try {
    const ins = await supabase
      .from("channel_metrics")
      .insert(validRows)
      .select();
    insertedData = ins.data;
    insertError = ins.error?.message || null;
  } catch (e) {
    insertError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    backfilledDate: targetDate,
    attempted: validRows.length,
    inserted: insertedData?.length ?? 0,
    deleteError,
    insertError,
    rows: validRows,
  });
}

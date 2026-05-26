import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Auth: requires either Vercel Cron's bearer token or a manual ?key=... matching CRON_SECRET
function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (cronSecret && key === cronSecret) return true;
  // Allow if no secret configured (dev convenience)
  if (!cronSecret) return true;
  return false;
}

async function safeFetch<T = unknown>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

interface SubstackResp { subscribers?: number; views?: number }
interface YoutubeResp { channel?: { subscribers?: number } }
interface YtAnalyticsResp { views?: number }
interface TelegramResp { channel?: { members?: number } }
interface TgPostsResp { posts?: { date: string; views?: number }[] }
interface ChannelSheetChannel { followers?: number; impressions?: number }
interface ChannelSheetResp { channels?: Record<string, ChannelSheetChannel> }

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://tiger-dashboard-delta.vercel.app";
  const today = new Date().toISOString().split("T")[0];

  // Fetch all sources in parallel
  const [ss, yt, ya, tg, tgp, cs] = await Promise.all([
    safeFetch<SubstackResp>(`${base}/api/substack-stats?range=7`),
    safeFetch<YoutubeResp>(`${base}/api/youtube`),
    safeFetch<YtAnalyticsResp>(`${base}/api/youtube-analytics?days=7`),
    safeFetch<TelegramResp>(`${base}/api/telegram`),
    safeFetch<TgPostsResp>(`${base}/api/telegram-posts`),
    safeFetch<ChannelSheetResp>(`${base}/api/channel-sheet`),
  ]);

  // Compute Telegram impressions from last 7 days of posts
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const tgImpressions = (tgp?.posts ?? [])
    .filter((p) => p.date >= cutoffStr)
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
      date: today,
      followers: ss?.subscribers ?? null,
      impressions: ss?.views ?? null,
      source: "auto",
    },
    {
      channel: "youtube",
      date: today,
      followers: yt?.channel?.subscribers ?? null,
      impressions: ya?.views ?? null,
      source: "auto",
    },
    {
      channel: "telegram",
      date: today,
      followers: tg?.channel?.members ?? null,
      impressions: tgImpressions > 0 ? tgImpressions : null,
      source: "auto",
    },
  ];

  // Sheet-driven channels — snapshot their current sheet values too
  if (cs?.channels) {
    for (const [key, v] of Object.entries(cs.channels)) {
      if (!["x", "linkedin", "xiaohongshu", "instagram_id", "x_jp"].includes(key)) continue;
      rows.push({
        channel: key,
        date: today,
        followers: v.followers ?? null,
        impressions: v.impressions ?? null,
        source: "auto",
      });
    }
  }

  // Upsert: one row per channel per day
  const { data, error } = await supabase
    .from("channel_metrics")
    .upsert(rows, { onConflict: "channel,date" })
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message, attempted: rows.length },
      { status: 500 }
    );
  }

  return NextResponse.json({
    snapshotDate: today,
    inserted: data?.length ?? 0,
    rows: data,
  });
}

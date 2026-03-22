import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const latest = searchParams.get("latest"); // "true" to get latest per channel

  try {
    if (latest === "true") {
      // Get the most recent entry per channel, manual > auto priority
      // For each channel, get all rows for the latest date, prefer manual
      const { data, error } = await supabase
        .from("channel_metrics")
        .select("*")
        .order("date", { ascending: false })
        .order("source", { ascending: false }); // 'manual' > 'auto' alphabetically

      if (error) throw error;

      // Group by channel, pick the best row per channel:
      // For the latest date, prefer manual over auto
      const byChannel: Record<string, typeof data[0]> = {};
      for (const row of data ?? []) {
        const existing = byChannel[row.channel];
        if (!existing) {
          byChannel[row.channel] = row;
        } else if (existing.date === row.date && row.source === "manual" && existing.source === "auto") {
          byChannel[row.channel] = row;
        }
        // If existing already has a newer date or is manual, skip
      }

      return NextResponse.json({ metrics: Object.values(byChannel) });
    }

    // Regular query with optional filters
    let query = supabase.from("channel_metrics").select("*");

    if (channel) {
      query = query.eq("channel", channel);
    }
    if (from) {
      query = query.gte("date", from);
    }
    if (to) {
      query = query.lte("date", to);
    }

    query = query.order("date", { ascending: false }).order("source", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Apply manual > auto priority: for same channel+date, keep manual only
    const seen = new Set<string>();
    const prioritized = (data ?? []).filter((row) => {
      const key = `${row.channel}:${row.date}`;
      if (seen.has(key)) {
        // Already have a row for this channel+date (which is manual since sorted)
        return false;
      }
      seen.add(key);
      return true;
    });

    return NextResponse.json({ metrics: prioritized });
  } catch (error) {
    console.error("Metrics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, date, followers, impressions, engagements, engagement_rate } = body;

    if (!channel || !date) {
      return NextResponse.json(
        { error: "channel and date are required" },
        { status: 400 }
      );
    }

    // Upsert manual data (unique on channel + date + source)
    const { data, error } = await supabase
      .from("channel_metrics")
      .upsert(
        {
          channel: channel.toLowerCase(),
          date,
          followers: followers ?? null,
          impressions: impressions ?? null,
          engagements: engagements ?? null,
          engagement_rate: engagement_rate ?? null,
          source: "manual",
        },
        { onConflict: "channel,date,source" }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Metrics POST error:", error);
    return NextResponse.json(
      { error: "Failed to save metrics" },
      { status: 500 }
    );
  }
}

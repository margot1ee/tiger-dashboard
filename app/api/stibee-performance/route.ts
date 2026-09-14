import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";
const TAB = "시트13";

function parseRate(s: string | undefined): number | null {
  if (!s) return null;
  const trimmed = s.trim().replace("%", "");
  const n = Number(trimmed);
  return isNaN(n) ? null : n;
}

function parseCount(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${TAB}'!A1:Z200`,
    });
    const rows = res.data.values ?? [];
    // Skip header row
    interface Campaign {
      round: string;
      date: string;
      openRate: number | null;
      clickRate: number | null;
      sent: number | null;
    }
    const campaigns: Campaign[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;
      const round = (r[0] || "").trim();
      const date = (r[1] || "").trim();
      const openRate = parseRate(r[2]);
      const clickRate = parseRate(r[3]);
      const sent = parseCount(r[4]);
      if (!date) continue;
      campaigns.push({ round, date, openRate, clickRate, sent });
    }

    // Latest (highest index in the ordered list)
    const latest = campaigns[campaigns.length - 1] ?? null;
    const prev = campaigns[campaigns.length - 2] ?? null;

    // Averages over last 4 for context
    const last4 = campaigns.slice(-4);
    const avg = (arr: (number | null)[]) => {
      const vals = arr.filter((v): v is number => v != null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
    };

    return NextResponse.json({
      campaigns,
      latest,
      prev,
      avgOpenRateLast4: avg(last4.map((c) => c.openRate)),
      avgClickRateLast4: avg(last4.map((c) => c.clickRate)),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to read Stibee performance sheet" },
      { status: 500 },
    );
  }
}

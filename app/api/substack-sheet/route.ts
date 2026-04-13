import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1o6o-vo0XSFc9RhFJX3KJRY-ATODw3ppu8wLv_CbZOFk";

export async function GET(request: Request) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") || "7");

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    // Previous period: same duration, immediately before
    const prevCutoff = new Date();
    prevCutoff.setDate(now.getDate() - days * 2);
    const prevCutoffStr = prevCutoff.toISOString().split("T")[0];

    // Read In (date, email, country, last_open, opened, source) and Out (date only)
    const [inRes, outRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "In!A:G",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Out!A:A",
      }),
    ]);

    const inRows = inRes.data.values ?? [];
    const outRows = outRes.data.values ?? [];

    // Process In tab: current + previous period
    let gained = 0;
    let prevGained = 0;
    let totalIn = 0;
    const sourceCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};

    for (let i = 1; i < inRows.length; i++) {
      const row = inRows[i];
      const date = row[0];
      if (!date) continue;
      totalIn++;

      if (date >= cutoffStr) {
        gained++;
        const source = (row[5] || "unknown").trim();
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        const country = (row[2] || "Unknown").trim() || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      } else if (date >= prevCutoffStr && date < cutoffStr) {
        prevGained++;
      }
    }

    // Process Out tab: current + previous period
    let lost = 0;
    let prevLost = 0;
    let totalOut = 0;
    for (let i = 1; i < outRows.length; i++) {
      const date = outRows[i][0];
      if (!date) continue;
      totalOut++;
      if (date >= cutoffStr) {
        lost++;
      } else if (date >= prevCutoffStr && date < cutoffStr) {
        prevLost++;
      }
    }

    const netChange = gained - lost;
    const prevNetChange = prevGained - prevLost;

    // WoW-style change percentages
    const gainedChangePercent = prevGained > 0
      ? Math.round(((gained - prevGained) / prevGained) * 1000) / 10
      : null;
    const lostChangePercent = prevLost > 0
      ? Math.round(((lost - prevLost) / prevLost) * 1000) / 10
      : null;
    const netChangePercent = prevNetChange !== 0
      ? Math.round(((netChange - prevNetChange) / Math.abs(prevNetChange)) * 1000) / 10
      : null;

    // Sort sources and countries by count desc
    const sources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const countries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      gained,
      lost,
      netChange,
      prevGained,
      prevLost,
      prevNetChange,
      gainedChangePercent,
      lostChangePercent,
      netChangePercent,
      totalIn,
      totalOut,
      days,
      cutoffDate: cutoffStr,
      prevCutoffDate: prevCutoffStr,
      sources,
      countries,
    });
  } catch (error) {
    console.error("Substack sheet error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet", detail: String(error) },
      { status: 500 }
    );
  }
}

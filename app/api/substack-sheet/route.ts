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

    // Process In tab: count gained + aggregate source & country
    let gained = 0;
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
        // Source (column index 5)
        const source = (row[5] || "unknown").trim();
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        // Country (column index 2)
        const country = (row[2] || "Unknown").trim() || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    }

    // Process Out tab
    let lost = 0;
    let totalOut = 0;
    for (let i = 1; i < outRows.length; i++) {
      const date = outRows[i][0];
      if (!date) continue;
      totalOut++;
      if (date >= cutoffStr) lost++;
    }

    const netChange = gained - lost;

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
      totalIn,
      totalOut,
      days,
      cutoffDate: cutoffStr,
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

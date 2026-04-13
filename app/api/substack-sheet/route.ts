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

    // Read In and Out tabs in parallel
    const [inRes, outRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "In!A:A",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Out!A:A",
      }),
    ]);

    const inRows = inRes.data.values ?? [];
    const outRows = outRes.data.values ?? [];

    // Count subscribers gained in period (skip header)
    let gained = 0;
    let totalIn = 0;
    for (let i = 1; i < inRows.length; i++) {
      const date = inRows[i][0];
      if (!date) continue;
      totalIn++;
      if (date >= cutoffStr) gained++;
    }

    // Count subscribers lost in period (skip header)
    let lost = 0;
    let totalOut = 0;
    for (let i = 1; i < outRows.length; i++) {
      const date = outRows[i][0];
      if (!date) continue;
      totalOut++;
      if (date >= cutoffStr) lost++;
    }

    const netChange = gained - lost;

    return NextResponse.json({
      gained,
      lost,
      netChange,
      totalIn,
      totalOut,
      days,
      cutoffDate: cutoffStr,
    });
  } catch (error) {
    console.error("Substack sheet error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet", detail: String(error) },
      { status: 500 }
    );
  }
}

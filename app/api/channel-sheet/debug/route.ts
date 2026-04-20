import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'시트10'!A1:ZZ30",
    });

    const rows = res.data.values || [];
    const headerRow = rows[0] || [];
    const dates = headerRow.slice(3);

    // For each channel, list followers per date column
    const summary: Record<string, Record<string, string>> = {};
    let currentPlatform = "";
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const platform = row[0]?.trim();
      const metric = row[1]?.trim();
      if (platform) currentPlatform = platform;
      if (metric !== "Followers") continue;
      if (!currentPlatform) continue;

      const perDate: Record<string, string> = {};
      for (let c = 3; c < headerRow.length; c++) {
        perDate[headerRow[c] || `col${c}`] = row[c] || "";
      }
      summary[currentPlatform] = perDate;
    }

    return NextResponse.json({ headerRow, dates, totalCols: headerRow.length, summary });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

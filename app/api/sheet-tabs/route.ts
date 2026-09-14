import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "sheets.properties(title,sheetId,gridProperties(rowCount,columnCount))",
    });
    const tabs = (meta.data.sheets ?? []).map((s) => ({
      title: s.properties?.title,
      sheetId: s.properties?.sheetId,
      rows: s.properties?.gridProperties?.rowCount,
      cols: s.properties?.gridProperties?.columnCount,
    }));
    return NextResponse.json({ tabs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list tabs" },
      { status: 500 },
    );
  }
}

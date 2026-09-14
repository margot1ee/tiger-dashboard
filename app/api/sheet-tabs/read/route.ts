import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") || "시트10";
  const range = url.searchParams.get("range") || "A1:Z50";
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tab}'!${range}`,
    });
    return NextResponse.json({ tab, rows: res.data.values ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to read tab" },
      { status: 500 },
    );
  }
}

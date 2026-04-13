import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1o6o-vo0XSFc9RhFJX3KJRY-ATODw3ppu8wLv_CbZOFk";

export async function GET(request: Request) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // First, get all sheet names
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "sheets.properties.title",
    });
    const sheetNames = meta.data.sheets?.map(s => s.properties?.title) ?? [];

    // Read the first sheet (or the one matching gid)
    const targetSheet = sheetNames[0] || "Sheet1";
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${targetSheet}!A1:Z50`,
    });

    return NextResponse.json({
      sheetNames,
      targetSheet,
      rows: res.data.values ?? [],
    });
  } catch (error) {
    console.error("Substack sheet error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet", detail: String(error) },
      { status: 500 }
    );
  }
}

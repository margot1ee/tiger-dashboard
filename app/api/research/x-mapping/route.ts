import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

// Reads a "Research_X" tab mapping research slug base → X post URL(s).
// Expected columns: A=slug_base | B=x_url_kor | C=x_url_eng | D=notes
// slug_base is the slug stripped of -eng/-kor suffix (e.g. "virtuals-protocol")

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";
const TAB = "Research_X";

export interface XMappingRow {
  slugBase: string;
  xUrlKor?: string;
  xUrlEng?: string;
  notes?: string;
}

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${TAB}'!A1:D500`,
    });
    const rows = res.data.values ?? [];
    const mappings: XMappingRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      mappings.push({
        slugBase: (r[0] || "").trim(),
        xUrlKor: (r[1] || "").trim() || undefined,
        xUrlEng: (r[2] || "").trim() || undefined,
        notes: (r[3] || "").trim() || undefined,
      });
    }
    return NextResponse.json({ mappings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    // If the tab doesn't exist yet, return empty mappings with a hint
    if (msg.includes("Unable to parse range")) {
      return NextResponse.json({
        mappings: [],
        hint: `Create a '${TAB}' tab in the spreadsheet with columns: slug_base | x_url_kor | x_url_eng | notes`,
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

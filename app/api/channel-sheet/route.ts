import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google-auth";

const SPREADSHEET_ID = "1KUHn2um4XGSEwj-NQ6pGMGbUP8OMsb4X5sbb4ObRat0";

function parseNumber(s: string | undefined): number {
  if (!s) return 0;
  return Number(s.replace(/,/g, "").replace(/%/g, "")) || 0;
}

const platformMap: Record<string, string> = {
  "Substack": "substack",
  "Youtube": "youtube",
  "X (Twitter)": "x",
  "LinkedIn": "linkedin",
  "KR TG": "telegram",
  "Xiaohongshu": "xiaohongshu",
  "ID IG": "instagram_id",
  "JP X": "x_jp",
};

const metricMap: Record<string, string> = {
  "Followers": "followers",
  "Follower Change": "followerChange",
  "Impressions": "impressions",
  "Views": "impressions",
  "Avg. Impressions": "impressions",
  "Like&Saves": "impressions",
};

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'시트10'!A1:ZZ30",
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      return NextResponse.json({ error: "No data" }, { status: 404 });
    }

    // Header row has dates
    const headerRow = rows[0];

    // Channels that are updated only via this sheet (no real-time API fallback).
    // Substack / YouTube / KR TG (Telegram) come from their own live APIs, so we
    // should NOT require them to be filled in the sheet to consider a column current.
    const sheetDrivenPlatforms = new Set([
      "X (Twitter)",
      "LinkedIn",
      "Xiaohongshu",
      "ID IG",
      "JP X",
    ]);

    const sheetFollowerRows: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const platform = rows[i - 1]?.[0]?.trim() || rows[i]?.[0]?.trim();
      void platform;
    }

    // Walk the rows once to collect Followers row indices per platform.
    let cp = "";
    const followerRowByPlatform: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const p = rows[i][0]?.trim();
      const m = rows[i][1]?.trim();
      if (p) cp = p;
      if (m === "Followers" && cp) followerRowByPlatform[cp] = i;
    }
    for (const [p, r] of Object.entries(followerRowByPlatform)) {
      if (sheetDrivenPlatforms.has(p)) sheetFollowerRows.push(r);
    }

    const filledSheetFollowerCount = (colIdx: number) => {
      let n = 0;
      for (const r of sheetFollowerRows) {
        const v = rows[r][colIdx];
        if (v && v.trim() !== "") n++;
      }
      return n;
    };

    // Pick latest column where ALL sheet-driven channels have follower data.
    // Real-time channels (Substack/YouTube/Telegram) are ignored for this check
    // because they'll be filled in by live APIs on the dashboard.
    let lastCol = headerRow.length - 1;
    for (let c = headerRow.length - 1; c >= 3; c--) {
      if (filledSheetFollowerCount(c) >= sheetFollowerRows.length) { lastCol = c; break; }
    }
    const prevCol = lastCol - 1;
    const currentDate = headerRow[lastCol] || "";
    const prevDate = headerRow[prevCol] || "";

    const channels: Record<string, {
      followers: number;
      prevFollowers: number;
      followersChange: number;
      followersChangePercent: number;
      impressions: number;
      prevImpressions: number;
      impressionsChange: number;
      impressionsChangePercent: number;
    }> = {};

    let currentPlatform = "";

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const platform = row[0]?.trim();
      const metric = row[1]?.trim();
      const wowGrowth = row[2]?.trim();

      if (platform) currentPlatform = platform;
      if (!currentPlatform || !metric) continue;

      const channelKey = platformMap[currentPlatform];
      const metricKey = metricMap[metric];
      if (!channelKey || !metricKey) continue;

      if (!channels[channelKey]) {
        channels[channelKey] = {
          followers: 0, prevFollowers: 0, followersChange: 0, followersChangePercent: 0,
          impressions: 0, prevImpressions: 0, impressionsChange: 0, impressionsChangePercent: 0,
        };
      }

      // Per-row: find the last column that has data for THIS row (channel),
      // so channels with unfilled latest columns still show their most recent value.
      let rowLastCol = lastCol;
      while (rowLastCol >= 3 && (!row[rowLastCol] || row[rowLastCol].trim() === "")) {
        rowLastCol--;
      }
      const rowPrevCol = rowLastCol - 1;

      const currentVal = parseNumber(row[rowLastCol]);
      const prevVal = parseNumber(row[rowPrevCol]);
      const changePercent = parseNumber(wowGrowth);

      if (metricKey === "followers") {
        channels[channelKey].followers = currentVal;
        channels[channelKey].prevFollowers = prevVal;
        channels[channelKey].followersChangePercent = changePercent;
      } else if (metricKey === "followerChange") {
        channels[channelKey].followersChange = currentVal;
      } else if (metricKey === "impressions") {
        channels[channelKey].impressions = currentVal;
        channels[channelKey].prevImpressions = prevVal;
        if (prevVal > 0) {
          channels[channelKey].impressionsChangePercent =
            Math.round(((currentVal - prevVal) / prevVal) * 1000) / 10;
        }
        channels[channelKey].impressionsChange = currentVal - prevVal;
      }
    }

    // Build trend arrays from all date columns
    const dates = headerRow.slice(3);
    const followerTrend: Record<string, unknown>[] = [];
    const impressionTrend: Record<string, unknown>[] = [];

    for (let colIdx = 0; colIdx < dates.length; colIdx++) {
      const date = dates[colIdx];
      if (!date) continue;
      const folPoint: Record<string, unknown> = { date };
      const impPoint: Record<string, unknown> = { date };
      let currentPlatform2 = "";

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const platform = row[0]?.trim();
        const metric = row[1]?.trim();
        if (platform) currentPlatform2 = platform;
        if (!currentPlatform2 || !metric) continue;

        const chKey = platformMap[currentPlatform2];
        const mKey = metricMap[metric];
        if (!chKey || !mKey) continue;

        const val = parseNumber(row[colIdx + 3]);
        if (val === 0) continue;

        const displayName = currentPlatform2
          .replace("KR TG", "Telegram")
          .replace("ID IG", "Instagram")
          .replace("JP X", "X (JP)");

        if (mKey === "followers") {
          folPoint[displayName] = val;
        } else if (mKey === "impressions") {
          impPoint[displayName] = val;
        }
      }

      if (Object.keys(folPoint).length > 1) followerTrend.push(folPoint);
      if (Object.keys(impPoint).length > 1) impressionTrend.push(impPoint);
    }

    return NextResponse.json(
      { channels, currentDate, prevDate, followerTrend, impressionTrend },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" } }
    );
  } catch (e) {
    console.error("Channel sheet error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch channel sheet" },
      { status: 500 }
    );
  }
}

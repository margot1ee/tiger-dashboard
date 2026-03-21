import { NextResponse } from "next/server";
import { getGoogleAuth } from "@/lib/google-auth";
import { google } from "googleapis";

export async function GET() {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json({ error: "SEARCH_CONSOLE_SITE_URL not set" }, { status: 500 });
  }

  try {
    const auth = getGoogleAuth();
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Daily search performance
    const dailyRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["date"],
        rowLimit: 30,
      },
    });

    const daily = dailyRes.data.rows?.map((row) => ({
      date: `${row.keys![0].slice(5, 7)}/${row.keys![0].slice(8, 10)}`,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      position: Math.round((row.position || 0) * 10) / 10,
      ctr: Math.round((row.ctr || 0) * 1000) / 10,
    })) || [];

    // Top keywords
    const keywordsRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query"],
        rowLimit: 20,
        type: "web",
      },
    });

    const keywords = keywordsRes.data.rows?.map((row) => ({
      keyword: row.keys![0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      position: Math.round((row.position || 0) * 10) / 10,
      ctr: Math.round((row.ctr || 0) * 1000) / 10,
    })) || [];

    // Top pages by search
    const pagesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["page"],
        rowLimit: 10,
        type: "web",
      },
    });

    const pages = pagesRes.data.rows?.map((row) => {
      const url = row.keys![0];
      const path = url.replace(siteUrl, "").replace(/\/$/, "") || "/";
      return {
        page: path,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: Math.round((row.position || 0) * 10) / 10,
        ctr: Math.round((row.ctr || 0) * 1000) / 10,
      };
    }) || [];

    // Summary
    const totalImpressions = daily.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = daily.reduce((s, d) => s + d.clicks, 0);
    const avgPosition = daily.length > 0
      ? Math.round(daily.reduce((s, d) => s + d.position, 0) / daily.length * 10) / 10
      : 0;
    const avgCtr = totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 1000) / 10
      : 0;

    return NextResponse.json({
      daily,
      keywords,
      pages,
      summary: { totalImpressions, totalClicks, avgPosition, avgCtr },
    });
  } catch (error) {
    console.error("Search Console API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Search Console data", detail: String(error) },
      { status: 500 }
    );
  }
}

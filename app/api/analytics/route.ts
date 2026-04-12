import { NextResponse } from "next/server";
import { getGoogleAuth } from "@/lib/google-auth";
import { google } from "googleapis";

export async function GET(request: Request) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ error: "GA4_PROPERTY_ID not set" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("from") || "30daysAgo";
  const endDate = searchParams.get("to") || "today";

  try {
    const auth = getGoogleAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    // Daily visitors & pageviews
    const dailyReport = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "newUsers" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    });

    const daily = dailyReport.data.rows?.map((row) => ({
      date: `${row.dimensionValues![0].value!.slice(4, 6)}/${row.dimensionValues![0].value!.slice(6, 8)}`,
      visitors: Number(row.metricValues![0].value),
      pageviews: Number(row.metricValues![1].value),
      newUsers: Number(row.metricValues![2].value),
      avgSessionDuration: Number(row.metricValues![3].value),
      bounceRate: Number(row.metricValues![4].value),
    })) || [];

    // Traffic sources (source / medium)
    const sourcesReport = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "15",
      },
    });

    const sourceColors = [
      "#f97316", "#3b82f6", "#22c55e", "#8b5cf6", "#ec4899",
      "#eab308", "#06b6d4", "#ef4444", "#14b8a6", "#f43f5e",
      "#a855f7", "#84cc16", "#0ea5e9", "#d946ef", "#6b7280",
    ];

    const sources = sourcesReport.data.rows?.map((row, i) => ({
      name: `${row.dimensionValues![0].value!} / ${row.dimensionValues![1].value!}`,
      value: Number(row.metricValues![0].value),
      color: sourceColors[i] || "#6b7280",
    })) || [];

    // Top pages
    const pagesReport = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "10",
      },
    });

    const pages = pagesReport.data.rows?.map((row) => {
      const seconds = Math.round(Number(row.metricValues![1].value));
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return {
        name: row.dimensionValues![0].value!,
        pageviews: Number(row.metricValues![0].value),
        avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
      };
    }) || [];

    // Country breakdown
    const countryReport = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "7",
      },
    });

    const countryColors = ["#f97316", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];
    const regions = countryReport.data.rows?.map((row, i) => ({
      name: row.dimensionValues![0].value!,
      value: Number(row.metricValues![0].value),
      color: countryColors[i] || "#6b7280",
    })) || [];

    // Summary totals
    const totalVisitors = daily.reduce((s, d) => s + d.visitors, 0);
    const totalPageviews = daily.reduce((s, d) => s + d.pageviews, 0);

    return NextResponse.json({
      daily,
      sources,
      pages,
      regions,
      summary: { totalVisitors, totalPageviews },
    });
  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GA4 data", detail: String(error) },
      { status: 500 }
    );
  }
}

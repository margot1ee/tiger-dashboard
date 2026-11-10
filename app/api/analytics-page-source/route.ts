import { NextResponse } from "next/server";
import { getGoogleAuth } from "@/lib/google-auth";
import { google } from "googleapis";

// Returns pageTitle × source/medium breakdown for a given date range.
// Lets us see: for each page, where did its traffic come from.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("from") || "7daysAgo";
  const endDate = searchParams.get("to") || "today";
  const sourceFilter = searchParams.get("source"); // e.g. "google"
  const mediumFilter = searchParams.get("medium"); // e.g. "organic"

  try {
    const auth = getGoogleAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) return NextResponse.json({ error: "GA4_PROPERTY_ID not set" }, { status: 500 });

    const requestBody: {
      dateRanges: { startDate: string; endDate: string }[];
      dimensions: { name: string }[];
      metrics: { name: string }[];
      orderBys: { metric: { metricName: string }; desc: boolean }[];
      limit: string;
      dimensionFilter?: {
        andGroup?: {
          expressions: { filter: { fieldName: string; stringFilter: { value: string } } }[];
        };
      };
    } = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "pageTitle" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
      ],
      metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: "100",
    };

    if (sourceFilter || mediumFilter) {
      const expressions: { filter: { fieldName: string; stringFilter: { value: string } } }[] = [];
      if (sourceFilter) expressions.push({ filter: { fieldName: "sessionSource", stringFilter: { value: sourceFilter } } });
      if (mediumFilter) expressions.push({ filter: { fieldName: "sessionMedium", stringFilter: { value: mediumFilter } } });
      requestBody.dimensionFilter = { andGroup: { expressions } };
    }

    const res = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody,
    });

    const rows = (res.data.rows || []).map((r) => ({
      pageTitle: r.dimensionValues?.[0]?.value || "",
      source: r.dimensionValues?.[1]?.value || "",
      medium: r.dimensionValues?.[2]?.value || "",
      pageviews: Number(r.metricValues?.[0]?.value || 0),
      sessions: Number(r.metricValues?.[1]?.value || 0),
    }));

    return NextResponse.json({
      from: startDate,
      to: endDate,
      filter: { source: sourceFilter, medium: mediumFilter },
      rows,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

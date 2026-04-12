import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "LINKEDIN_ACCESS_TOKEN not set. Visit /api/auth/linkedin to authenticate." },
      { status: 401 }
    );
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202401",
  };

  try {
    // Get organization ID for Tiger Research
    // First try to find the organization
    const orgSearchRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName)))",
      { headers, next: { revalidate: 3600 } }
    );

    let orgId = process.env.LINKEDIN_ORG_ID || "";
    let orgName = "Tiger Research";

    if (orgSearchRes.ok) {
      const orgData = await orgSearchRes.json();
      const orgs = orgData.elements || [];
      if (orgs.length > 0) {
        const org = orgs[0]["organization~"] || orgs[0].organization;
        if (org) {
          orgId = org.id || orgId;
          orgName = org.localizedName || orgName;
        }
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Could not find LinkedIn organization. Set LINKEDIN_ORG_ID in .env.local" },
        { status: 404 }
      );
    }

    // Get follower count
    const followerRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/urn:li:organization:${orgId}?edgeType=CompanyFollowedByMember`,
      { headers, next: { revalidate: 3600 } }
    );

    let followers = 0;
    if (followerRes.ok) {
      const followerData = await followerRes.json();
      followers = followerData.firstDegreeSize || 0;
    }

    // Get share statistics (impressions) for last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const statsRes = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${thirtyDaysAgo}&timeIntervals.timeRange.end=${now}`,
      { headers, next: { revalidate: 3600 } }
    );

    let totalImpressions = 0;
    let totalEngagements = 0;

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const elements = statsData.elements || [];
      for (const el of elements) {
        const stats = el.totalShareStatistics || {};
        totalImpressions += stats.impressionCount || 0;
        totalEngagements += (stats.likeCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0);
      }
    }

    return NextResponse.json({
      organization: { id: orgId, name: orgName },
      followers,
      impressions: totalImpressions,
      engagements: totalEngagements,
    });
  } catch (e) {
    console.error("LinkedIn API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch LinkedIn data" },
      { status: 500 }
    );
  }
}

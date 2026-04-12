import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `LinkedIn OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "LinkedIn credentials not configured" }, { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to get access token", detail: tokenData },
        { status: 400 }
      );
    }

    // Return the token to be saved manually in .env.local
    // In production, store in Supabase or encrypted storage
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>LinkedIn OAuth Success!</h2>
        <p>Access Token (add to .env.local as LINKEDIN_ACCESS_TOKEN):</p>
        <pre style="background:#f3f4f6;padding:16px;border-radius:8px;word-break:break-all">${tokenData.access_token}</pre>
        <p>Expires in: ${tokenData.expires_in} seconds (${Math.round(tokenData.expires_in / 86400)} days)</p>
        <p><a href="/">Back to Dashboard</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OAuth callback failed" },
      { status: 500 }
    );
  }
}

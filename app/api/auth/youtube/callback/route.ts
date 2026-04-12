import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `YouTube OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to get access token", detail: tokenData },
        { status: 400 }
      );
    }

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>YouTube Analytics OAuth Success!</h2>
        <p><strong>Access Token</strong> (add to .env.local as YOUTUBE_ACCESS_TOKEN):</p>
        <pre style="background:#f3f4f6;padding:16px;border-radius:8px;word-break:break-all">${tokenData.access_token}</pre>
        ${tokenData.refresh_token ? `<p><strong>Refresh Token</strong> (add as YOUTUBE_REFRESH_TOKEN):</p>
        <pre style="background:#f3f4f6;padding:16px;border-radius:8px;word-break:break-all">${tokenData.refresh_token}</pre>` : ""}
        <p>Expires in: ${tokenData.expires_in} seconds</p>
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

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const bearerToken = process.env.X_BEARER_TOKEN;
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "tiger_research";

  if (!bearerToken) {
    return NextResponse.json(
      { error: "X Bearer Token not configured" },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${bearerToken}`,
  };

  try {
    // Fetch user data with public metrics
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,name,username,description,profile_image_url,created_at`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!userRes.ok) {
      const errBody = await userRes.text();
      return NextResponse.json(
        { error: `X API error: ${userRes.status} ${errBody}` },
        { status: userRes.status }
      );
    }

    const userData = await userRes.json();

    if (!userData.data) {
      return NextResponse.json(
        { error: "X user not found" },
        { status: 404 }
      );
    }

    const user = userData.data;
    const userId = user.id;

    // Fetch recent tweets with public metrics
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at,text`,
      { headers, next: { revalidate: 3600 } }
    );

    let tweets: {
      id: string;
      text: string;
      created_at: string;
      public_metrics: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
        impression_count: number;
      };
    }[] = [];

    if (tweetsRes.ok) {
      const tweetsData = await tweetsRes.json();
      tweets = tweetsData.data || [];
    }

    return NextResponse.json({
      user: {
        name: user.name,
        username: user.username,
        description: user.description || "",
        profileImageUrl: user.profile_image_url || "",
        createdAt: user.created_at || "",
        followers: user.public_metrics.followers_count,
        following: user.public_metrics.following_count,
        tweetCount: user.public_metrics.tweet_count,
      },
      tweets: tweets.map((t) => ({
        id: t.id,
        text: t.text,
        createdAt: t.created_at,
        metrics: {
          retweets: t.public_metrics.retweet_count,
          replies: t.public_metrics.reply_count,
          likes: t.public_metrics.like_count,
          quotes: t.public_metrics.quote_count,
          impressions: t.public_metrics.impression_count,
        },
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch X data" },
      { status: 500 }
    );
  }
}

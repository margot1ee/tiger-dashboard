import { NextResponse } from "next/server";

// Fetches public X (Twitter) tweet/article data via the Syndication API.
// No auth, no API key. Works for X Articles too.
// Returns: likes (favorite_count), replies (conversation_count), article metadata if present.

interface TweetData {
  id: string;
  likes: number;
  replies: number;
  createdAt: string;
  text: string;
  author: { handle: string; name: string };
  article?: {
    title: string;
    preview: string;
    coverImage?: string;
    url: string;
  };
}

function extractTweetId(input: string): string | null {
  // Accept raw id, status URL, article URL
  const idMatch = input.match(/^\d{10,25}$/);
  if (idMatch) return input;
  const statusMatch = input.match(/\/status\/(\d+)/);
  if (statusMatch) return statusMatch[1];
  const articleMatch = input.match(/\/article\/(\d+)/);
  if (articleMatch) return articleMatch[1];
  const iArticleMatch = input.match(/\/i\/article\/(\d+)/);
  if (iArticleMatch) return iArticleMatch[1];
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const input = url.searchParams.get("id") || url.searchParams.get("url") || "";
  const id = extractTweetId(input);
  if (!id) {
    return NextResponse.json(
      { error: "Provide ?id=<tweet_id> or ?url=<tweet_url>" },
      { status: 400 },
    );
  }

  try {
    // Syndication requires any non-empty token param
    const r = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=a`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 1800 },
      },
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: `Syndication fetch failed: ${r.status}` },
        { status: r.status },
      );
    }
    const data = await r.json();
    if (!data || !data.id_str) {
      return NextResponse.json(
        { error: "Tweet not found or private" },
        { status: 404 },
      );
    }
    const result: TweetData = {
      id: data.id_str,
      likes: data.favorite_count ?? 0,
      replies: data.conversation_count ?? 0,
      createdAt: data.created_at ?? "",
      text: data.text ?? "",
      author: {
        handle: data.user?.screen_name ?? "",
        name: data.user?.name ?? "",
      },
    };
    if (data.article) {
      result.article = {
        title: data.article.title ?? "",
        preview: data.article.preview_text ?? "",
        coverImage: data.article.cover_media?.media_info?.original_img_url,
        url: `https://x.com/i/article/${data.article.rest_id}`,
      };
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch tweet" },
      { status: 500 },
    );
  }
}

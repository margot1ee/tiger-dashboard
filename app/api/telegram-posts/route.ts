import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://t.me/s/tiger_research", {
      next: { revalidate: 3600 },
    });
    const html = await res.text();

    // Parse posts from Telegram public page
    const posts: { date: string; title: string; views: number }[] = [];

    // Match message blocks
    const messageRegex = /tgme_widget_message_wrap[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<span class="tgme_widget_message_views"[^>]*>([^<]*)<\/span>[\s\S]*?<time[^>]*datetime="([^"]*)"[^>]*>/g;

    let match;
    while ((match = messageRegex.exec(html)) !== null) {
      const textHtml = match[1];
      const viewsStr = match[2].trim();
      const dateStr = match[3];

      // Strip HTML tags to get plain text
      const text = textHtml.replace(/<[^>]*>/g, "").trim();
      const title = text.slice(0, 100) + (text.length > 100 ? "..." : "");

      // Parse views (e.g., "4.9K" -> 4900)
      let views = 0;
      if (viewsStr.endsWith("K")) {
        views = Math.round(parseFloat(viewsStr) * 1000);
      } else if (viewsStr.endsWith("M")) {
        views = Math.round(parseFloat(viewsStr) * 1000000);
      } else {
        views = parseInt(viewsStr) || 0;
      }

      const date = dateStr.split("T")[0];

      if (title && date) {
        posts.push({ date, title, views });
      }
    }

    // If regex didn't work, try simpler approach
    if (posts.length === 0) {
      // Fallback: extract basic info from meta tags or simpler patterns
      const simpleRegex = /datetime="(\d{4}-\d{2}-\d{2})[^"]*"[\s\S]*?tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g;
      let simpleMatch;
      while ((simpleMatch = simpleRegex.exec(html)) !== null) {
        const date = simpleMatch[1];
        const text = simpleMatch[2].replace(/<[^>]*>/g, "").trim();
        const title = text.slice(0, 100) + (text.length > 100 ? "..." : "");
        if (title && date) {
          posts.push({ date, title, views: 0 });
        }
      }
    }

    return NextResponse.json({ posts, totalPosts: posts.length });
  } catch (error) {
    console.error("Telegram posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram posts", posts: [] },
      { status: 500 }
    );
  }
}

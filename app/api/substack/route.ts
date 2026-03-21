import { NextResponse } from "next/server";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export async function GET() {
  try {
    const res = await fetch("https://reports.tiger-research.com/feed", {
      next: { revalidate: 3600 },
    });
    const xml = await res.text();

    // Simple XML parsing for RSS
    const items: RssItem[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 20)) {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        || itemXml.match(/<title>(.*?)<\/title>/)?.[1]
        || "";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        || itemXml.match(/<description>(.*?)<\/description>/)?.[1]
        || "";

      items.push({
        title,
        link,
        pubDate,
        description: description.replace(/<[^>]*>/g, "").slice(0, 200),
      });
    }

    return NextResponse.json({
      posts: items,
      totalPosts: items.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Substack RSS" },
      { status: 500 }
    );
  }
}

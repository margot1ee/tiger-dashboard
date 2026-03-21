"use client";

import { useState, useEffect } from "react";

interface YouTubeData {
  channel: {
    title: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
  };
  videos: {
    id: string;
    title: string;
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
  }[];
}

interface SubstackData {
  posts: {
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }[];
  totalPosts: number;
}

export function useYouTubeData() {
  const [data, setData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/youtube")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Failed to fetch"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSubstackData() {
  const [data, setData] = useState<SubstackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/substack")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Failed to fetch"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

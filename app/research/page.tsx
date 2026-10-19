"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  MessageCircle,
  ExternalLink,
  Mail,
  Send,
  Globe,
  Newspaper,
  BarChart3,
  Loader2,
  FileText,
} from "lucide-react";

interface Research {
  id: string;
  titleKor?: string;
  titleEng?: string;
  slugKor?: string;
  slugEng?: string;
  linkKor?: string;
  linkEng?: string;
  pubDate: string;
  description: string;
}

interface Detail {
  slug: string;
  slugBase: string;
  pubDate: string;
  title: string;
  window: { from: string; to: string };
  ga4: null | {
    totalSessions: number;
    totalPageviews: number;
    pages: { pagePath: string; pageTitle?: string; sessions: number; pageviews: number }[];
    sources: { name: string; sessions: number }[];
    countries: { name: string; sessions: number }[];
  };
  stibee: null | {
    round: string;
    date: string;
    openRate: number | null;
    clickRate: number | null;
    sent: number | null;
  };
  telegram: null | {
    matched: { date: string; title: string; views?: number }[];
    totalViews: number;
  };
  pr: null | {
    total: number;
    bySource: { name: string; count: number }[];
    matches: {
      title: string;
      link: string;
      pubDate: string;
      source: string;
      lang?: string;
      daysAfterPub: number;
    }[];
    keywordsUsed: string[];
  };
  x: {
    kor: null | XTweet;
    eng: null | XTweet;
    mapping: null | { slugBase: string; xUrlKor?: string; xUrlEng?: string; notes?: string };
  };
}

interface XTweet {
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

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "오늘";
  if (d === 1) return "어제";
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  if (d < 365) return `${Math.floor(d / 30)}개월 전`;
  return `${Math.floor(d / 365)}년 전`;
}

export default function ResearchPage() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected] = useState<Research | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/research/list")
      .then((r) => r.json())
      .then((d) => {
        setResearches(d.researches || []);
        if (d.researches?.[0]) setSelected(d.researches[0]);
      })
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDetailLoading(true);
    setDetail(null);
    const slug = selected.slugEng || selected.slugKor || selected.id;
    const title = selected.titleEng || selected.titleKor || "";
    const url = `/api/research/detail?slug=${encodeURIComponent(slug)}&pubDate=${encodeURIComponent(selected.pubDate)}&title=${encodeURIComponent(title)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .finally(() => setDetailLoading(false));
  }, [selected]);

  const filtered = researches.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (r.titleKor || "").toLowerCase().includes(q) ||
      (r.titleEng || "").toLowerCase().includes(q) ||
      r.id.includes(q)
    );
  });

  return (
    <div className="flex gap-6 -m-6 h-[calc(100vh-0px)]">
      {/* Left: list */}
      <div className="w-80 shrink-0 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-base mb-2">Research</h2>
          <input
            type="text"
            placeholder="검색..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm px-3 py-1.5 border rounded-md"
          />
          <p className="text-[11px] text-muted-foreground mt-2">
            {researches.length}개 리서치
          </p>
        </div>
        <ScrollArea className="flex-1">
          {listLoading && (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> 로딩중...
            </div>
          )}
          <div className="p-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-md mb-1 transition-colors ${
                  selected?.id === r.id
                    ? "bg-orange-50 text-orange-700"
                    : "hover:bg-muted"
                }`}
              >
                <div className="text-sm font-medium line-clamp-2">
                  {r.titleKor || r.titleEng}
                </div>
                {r.titleEng && r.titleKor && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {r.titleEng}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-1">
                  {daysAgo(r.pubDate)} · {r.pubDate.split("T")[0]}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-auto">
        {!selected && (
          <div className="p-8 text-muted-foreground">리서치를 선택하세요</div>
        )}
        {selected && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {selected.pubDate.split("T")[0]} · {daysAgo(selected.pubDate)}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {selected.titleKor || selected.titleEng}
              </h1>
              {selected.titleEng && selected.titleKor && (
                <h2 className="text-lg text-muted-foreground mt-1">
                  {selected.titleEng}
                </h2>
              )}
              <div className="flex gap-2 mt-3">
                {selected.linkKor && (
                  <a
                    href={selected.linkKor}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/70 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> KOR
                  </a>
                )}
                {selected.linkEng && (
                  <a
                    href={selected.linkEng}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/70 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> ENG
                  </a>
                )}
              </div>
            </div>

            {detailLoading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> 성과
                데이터 수집중...
              </div>
            )}

            {detail && (
              <>
                {/* Row 1: Substack GA4 + Stibee + Telegram */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <FileText className="h-3 w-3" /> Substack 트래픽 (30일)
                    </div>
                    {detail.ga4 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {fmt(detail.ga4.totalPageviews)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Pageviews · {fmt(detail.ga4.totalSessions)} sessions
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Mail className="h-3 w-3" /> 뉴스레터 (매칭)
                    </div>
                    {detail.stibee ? (
                      <>
                        <div className="text-2xl font-bold">
                          {detail.stibee.openRate != null
                            ? `${detail.stibee.openRate.toFixed(1)}%`
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          오픈율 · {detail.stibee.round} ·{" "}
                          {detail.stibee.clickRate != null
                            ? `클릭 ${detail.stibee.clickRate.toFixed(1)}%`
                            : ""}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        매칭 없음 (±7일)
                      </div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Send className="h-3 w-3" /> 텔레그램 조회수
                    </div>
                    {detail.telegram && detail.telegram.matched.length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {fmt(detail.telegram.totalViews)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {detail.telegram.matched.length}개 포스트
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        매칭 없음
                      </div>
                    )}
                  </Card>
                </div>

                {/* Row 2: X performance */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      X / Twitter 성과
                    </div>
                    {!detail.x.mapping && (
                      <span className="text-[10px] text-muted-foreground">
                        스프레드시트 Research_X 탭에 URL을 추가하세요
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <XCard label="KOR" tweet={detail.x.kor} />
                    <XCard label="ENG" tweet={detail.x.eng} />
                  </div>
                </Card>

                {/* Row 3: PR coverage */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Newspaper className="h-3 w-3" /> PR 보도 매칭 (60일 윈도우)
                  </div>
                  {detail.pr && detail.pr.total > 0 ? (
                    <>
                      <div className="flex items-baseline gap-3 mb-3">
                        <div className="text-2xl font-bold">
                          {detail.pr.total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          매체 {detail.pr.bySource.length}개
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {detail.pr.bySource.slice(0, 10).map((s) => (
                          <Badge key={s.name} variant="secondary" className="text-[10px]">
                            {s.name} {s.count}
                          </Badge>
                        ))}
                      </div>
                      <div className="space-y-1 max-h-72 overflow-y-auto">
                        {detail.pr.matches.slice(0, 20).map((m, i) => (
                          <a
                            key={i}
                            href={m.link}
                            target="_blank"
                            rel="noreferrer"
                            className="block py-1.5 px-2 hover:bg-muted rounded text-xs"
                          >
                            <div className="font-medium line-clamp-1">{m.title}</div>
                            <div className="text-muted-foreground text-[10px] mt-0.5">
                              {m.source} · {m.pubDate.split("T")[0]} ·{" "}
                              +{m.daysAfterPub}일
                            </div>
                          </a>
                        ))}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        키워드: {detail.pr.keywordsUsed.slice(0, 8).join(", ")}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      매칭된 PR 없음
                    </div>
                  )}
                </Card>

                {/* Row 4: GA4 traffic sources + countries */}
                {detail.ga4 && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <BarChart3 className="h-3 w-3" /> 유입 경로
                      </div>
                      <div className="space-y-1.5">
                        {detail.ga4.sources.slice(0, 10).map((s) => (
                          <div key={s.name} className="flex items-center justify-between text-xs">
                            <span className="truncate text-muted-foreground">
                              {s.name}
                            </span>
                            <span className="font-medium ml-2">
                              {fmt(s.sessions)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Globe className="h-3 w-3" /> 국가별
                      </div>
                      <div className="space-y-1.5">
                        {detail.ga4.countries.slice(0, 10).map((c) => (
                          <div key={c.name} className="flex items-center justify-between text-xs">
                            <span className="truncate text-muted-foreground">
                              {c.name}
                            </span>
                            <span className="font-medium ml-2">
                              {fmt(c.sessions)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function XCard({ label, tweet }: { label: string; tweet: XTweet | null }) {
  if (!tweet) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        {label}: URL 미등록
      </div>
    );
  }
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-[10px]">
          {label}
        </Badge>
        <a
          href={`https://x.com/${tweet.author.handle}/status/${tweet.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <span className="text-lg font-bold">{fmt(tweet.likes)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-lg font-bold">{fmt(tweet.replies)}</span>
        </div>
      </div>
      {tweet.article && (
        <div className="flex gap-2 mt-2 p-2 bg-muted/40 rounded">
          {tweet.article.coverImage && (
            <Image
              src={tweet.article.coverImage}
              alt=""
              width={48}
              height={48}
              className="rounded object-cover"
              unoptimized
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium line-clamp-2">
              {tweet.article.title}
            </div>
            <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
              {tweet.article.preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

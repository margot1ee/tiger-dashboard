"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { channelMetrics } from "@/lib/demo-data";
import { useYouTubeData, useTelegramData, useXData } from "@/lib/hooks";
import { ArrowRight } from "lucide-react";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const channelConfig: Record<string, { icon: React.ReactNode; description: string; href: string }> = {
  substack: {
    icon: <SubstackIcon className="h-6 w-6" />,
    description: "Newsletter subscribers & post performance",
    href: "/channels/substack",
  },
  x: {
    icon: <XIcon className="h-6 w-6" />,
    description: "Followers, tweets & engagement",
    href: "/channels/x",
  },
  linkedin: {
    icon: <LinkedInIcon className="h-6 w-6" />,
    description: "Company page followers & posts",
    href: "/channels/linkedin",
  },
  youtube: {
    icon: <YouTubeIcon className="h-6 w-6" />,
    description: "Subscribers, views & watch time",
    href: "/channels/youtube",
  },
  telegram: {
    icon: <TelegramIcon className="h-6 w-6" />,
    description: "Group members & activity",
    href: "/channels/telegram",
  },
};

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function ChannelsPage() {
  const { data: ytData } = useYouTubeData();
  const { data: tgData } = useTelegramData();
  const { data: xData } = useXData();

  // Merge real data
  const mergedMetrics = { ...channelMetrics };
  if (ytData) {
    mergedMetrics.youtube = { ...mergedMetrics.youtube, followers: ytData.channel.subscribers };
  }
  if (tgData) {
    mergedMetrics.telegram = { ...mergedMetrics.telegram, followers: tgData.channel.members };
  }
  if (xData) {
    mergedMetrics.x = { ...mergedMetrics.x, followers: xData.user.followers };
  }

  const liveChannels = new Set<string>();
  if (ytData) liveChannels.add("youtube");
  if (tgData) liveChannels.add("telegram");
  if (xData) liveChannels.add("x");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a channel to view detailed analytics
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(mergedMetrics).map(([key, ch]) => {
          const config = channelConfig[key];
          const isLive = liveChannels.has(key);
          return (
            <Link key={key} href={config.href}>
              <Card className="hover:border-orange-300 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: ch.color + "15", color: ch.color }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {ch.name}
                      {isLive && <Badge className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0">LIVE</Badge>}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatNumber(ch.followers)}
                    </span>
                    {!isLive && (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          ch.change > 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {ch.change > 0 ? "+" : ""}
                        {ch.change}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

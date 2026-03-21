"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { channelMetrics } from "@/lib/demo-data";
import { Mail, Twitter, Linkedin, Youtube, Send, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const channelConfig: Record<string, { icon: React.ReactNode; description: string; href: string }> = {
  substack: {
    icon: <Mail className="h-6 w-6" />,
    description: "Newsletter subscribers & post performance",
    href: "/channels/substack",
  },
  x: {
    icon: <Twitter className="h-6 w-6" />,
    description: "Followers, tweets & engagement",
    href: "/channels/x",
  },
  linkedin: {
    icon: <Linkedin className="h-6 w-6" />,
    description: "Company page followers & posts",
    href: "/channels/linkedin",
  },
  youtube: {
    icon: <Youtube className="h-6 w-6" />,
    description: "Subscribers, views & watch time",
    href: "/channels/youtube",
  },
  telegram: {
    icon: <Send className="h-6 w-6" />,
    description: "Group members & activity",
    href: "/channels/telegram",
  },
};

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function ChannelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a channel to view detailed analytics
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(channelMetrics).map(([key, ch]) => {
          const config = channelConfig[key];
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
                    <CardTitle className="text-base">{ch.name}</CardTitle>
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
                    <span
                      className={cn(
                        "text-sm font-medium",
                        ch.change > 0 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {ch.change > 0 ? "+" : ""}
                      {ch.change}%
                    </span>
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

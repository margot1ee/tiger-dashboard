"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Mail, Twitter, Linkedin } from "lucide-react";

interface ChannelInput {
  channel: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; placeholder: string }[];
}

const channels: ChannelInput[] = [
  {
    channel: "Substack",
    icon: <Mail className="h-4 w-4" />,
    fields: [
      { key: "subscribers", label: "Total Subscribers", placeholder: "e.g. 22500" },
      { key: "openRate", label: "Avg. Open Rate (%)", placeholder: "e.g. 42" },
      { key: "weeklyViews", label: "Weekly Post Views", placeholder: "e.g. 8500" },
    ],
  },
  {
    channel: "X (Twitter)",
    icon: <Twitter className="h-4 w-4" />,
    fields: [
      { key: "followers", label: "Total Followers", placeholder: "e.g. 18700" },
      { key: "impressions", label: "Weekly Impressions", placeholder: "e.g. 125000" },
      { key: "engagements", label: "Weekly Engagements", placeholder: "e.g. 4500" },
      { key: "engagementRate", label: "Engagement Rate (%)", placeholder: "e.g. 3.6" },
    ],
  },
  {
    channel: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    fields: [
      { key: "followers", label: "Total Followers", placeholder: "e.g. 1400" },
      { key: "impressions", label: "Weekly Impressions", placeholder: "e.g. 8500" },
      { key: "engagements", label: "Weekly Engagements", placeholder: "e.g. 320" },
    ],
  },
];

export default function InputPage() {
  const [selectedChannel, setSelectedChannel] = useState("Substack");
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const currentChannel = channels.find((c) => c.channel === selectedChannel)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to Supabase
    console.log("Submitting:", { channel: selectedChannel, ...values });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setValues({});
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Input</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter weekly stats for channels without API access
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Weekly Data Entry
            <Badge variant="secondary" className="text-xs">
              Manual
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Channel
              </label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.channel} value={ch.channel}>
                      <span className="flex items-center gap-2">
                        {ch.icon}
                        {ch.channel}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Week
              </label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>

            {currentChannel.fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-1.5 block">
                  {field.label}
                </label>
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              </div>
            ))}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={submitted}
            >
              {submitted ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </span>
              ) : (
                "Save Weekly Data"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Auto-collected channels (no input needed)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["YouTube (API)", "Telegram (Bot API)", "GA4 (API)", "Search Console (API)", "Substack Posts (RSS)"].map(
            (ch) => (
              <div key={ch} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{ch}</span>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

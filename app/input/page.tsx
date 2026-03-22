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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";
import { SubstackIcon } from "@/components/icons/substack-icon";
import { LinkedInIcon } from "@/components/icons/linkedin-icon";

interface ChannelInput {
  channel: string;
  dbKey: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; placeholder: string; dbField: string }[];
}

const channels: ChannelInput[] = [
  {
    channel: "Substack",
    dbKey: "substack",
    icon: <SubstackIcon className="h-4 w-4" />,
    fields: [
      { key: "subscribers", label: "Total Subscribers", placeholder: "e.g. 22500", dbField: "followers" },
      { key: "openRate", label: "Avg. Open Rate (%)", placeholder: "e.g. 42", dbField: "engagement_rate" },
      { key: "weeklyViews", label: "Weekly Post Views", placeholder: "e.g. 8500", dbField: "impressions" },
    ],
  },
  {
    channel: "X",
    dbKey: "x",
    icon: <XIcon className="h-4 w-4" />,
    fields: [
      { key: "followers", label: "Total Followers", placeholder: "e.g. 18700", dbField: "followers" },
      { key: "impressions", label: "Weekly Impressions", placeholder: "e.g. 125000", dbField: "impressions" },
      { key: "engagements", label: "Weekly Engagements", placeholder: "e.g. 4500", dbField: "engagements" },
      { key: "engagementRate", label: "Engagement Rate (%)", placeholder: "e.g. 3.6", dbField: "engagement_rate" },
    ],
  },
  {
    channel: "LinkedIn",
    dbKey: "linkedin",
    icon: <LinkedInIcon className="h-4 w-4" />,
    fields: [
      { key: "followers", label: "Total Followers", placeholder: "e.g. 1400", dbField: "followers" },
      { key: "impressions", label: "Weekly Impressions", placeholder: "e.g. 8500", dbField: "impressions" },
      { key: "engagements", label: "Weekly Engagements", placeholder: "e.g. 320", dbField: "engagements" },
    ],
  },
];

export default function InputPage() {
  const [selectedChannel, setSelectedChannel] = useState("Substack");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const currentChannel = channels.find((c) => c.channel === selectedChannel)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    // Map form fields to DB fields
    const payload: Record<string, string | number | null> = {
      channel: currentChannel.dbKey,
      date,
    };

    for (const field of currentChannel.fields) {
      const val = values[field.key];
      if (val && val.trim() !== "") {
        payload[field.dbField] = Number(val);
      }
    }

    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save");
      }

      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setValues({});
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to save data");
      setTimeout(() => setStatus("idle"), 3000);
    }
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
              <Select value={selectedChannel} onValueChange={(v) => { if (v) { setSelectedChannel(v); setValues({}); } }}>
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
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {currentChannel.fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-1.5 block">
                  {field.label}
                </label>
                <Input
                  type="number"
                  step="any"
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
              disabled={status === "saving" || status === "success"}
            >
              {status === "saving" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : status === "success" ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved to Supabase!
                </span>
              ) : status === "error" ? (
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Error - try again
                </span>
              ) : (
                "Save Weekly Data"
              )}
            </Button>

            {status === "error" && errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}
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

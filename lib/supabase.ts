import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChannelMetricRow {
  id: number;
  channel: string;
  date: string;
  followers: number | null;
  impressions: number | null;
  engagements: number | null;
  engagement_rate: number | null;
  source: "auto" | "manual";
  created_at: string;
}

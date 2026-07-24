import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy client — Next.js 16's page-data collection runs API-route module code
// during build without env vars, so eager init throws "supabaseUrl is required".
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  _client = createClient(url, anon);
  return _client;
}

// Proxy: routes can still `import { supabase }` and call `.from()`, but the
// underlying client is only created on first use.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    // @ts-expect-error dynamic prop access on Supabase client
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

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

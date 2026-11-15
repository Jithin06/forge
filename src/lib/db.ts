import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-only database client using the service key. Row-level security has
 * no policies, so this is the only way to read or write tables. Importing
 * this file from a client component fails the build ("server-only").
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

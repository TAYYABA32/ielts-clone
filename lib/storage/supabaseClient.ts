import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Service-role client: server-only, bypasses Row Level Security. Never
 * import this from a "use client" component or expose the key to the
 * browser. Lazily constructed so a missing env var only throws when a
 * request actually needs storage, not at module load / build time.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase Storage.");
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  return cachedClient;
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

export function getSupabaseAdminClient() {
  const env = getSupabaseEnv();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env || !serviceRole) return null;
  return createClient(env.url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

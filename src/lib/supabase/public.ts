import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

/** 公开页用：无用户 cookie，依赖 RLS published 策略 */
export function createPublicSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

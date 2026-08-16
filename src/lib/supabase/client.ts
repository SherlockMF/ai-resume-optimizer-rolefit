"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

let client: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  client ??= createBrowserClient(env.url, env.publishableKey);
  return client;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseClient } from "./server";

export type AiFeatureKey =
  | "diagnose"
  | "refine"
  | "outreach"
  | "translate"
  | "portfolio"
  | "online_resume";

export class AiQuotaExceededError extends Error {
  constructor() {
    super("本月免费 AI 使用额度已用完。");
    this.name = "AiQuotaExceededError";
  }
}

export function hasAvailableAiUnits(
  limit: number,
  used: number,
  requested = 1,
): boolean {
  return limit >= 0 && used >= 0 && requested > 0 && used + requested <= limit;
}

type AiUsageContext = {
  client: SupabaseClient;
  userId: string;
  featureKey: AiFeatureKey;
};

function currentMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function isMissingAuthSession(error: { message?: string; name?: string; code?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.name === "AuthSessionMissingError" ||
    error.code === "session_not_found" ||
    /auth session missing/i.test(message)
  );
}

function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes("fetch failed") || message.includes("network") || message.includes("econnrefused")) {
    return true;
  }
  const cause = "cause" in error ? error.cause : undefined;
  return cause instanceof Error && /fetch failed|network|econnrefused/i.test(cause.message);
}

export async function prepareAiUsage(
  featureKey: AiFeatureKey,
): Promise<AiUsageContext | null> {
  const client = await getServerSupabaseClient();
  if (!client) return null;

  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    // 匿名访问或 cookie 未同步到服务端：跳过额度统计，不阻断 AI
    if (userError) {
      if (isMissingAuthSession(userError)) return null;
      throw userError;
    }
    const user = userData.user;
    if (!user) return null;

    const { data: entitlement, error: entitlementError } = await client
      .from("user_entitlements")
      .select("monthly_ai_units")
      .eq("user_id", user.id)
      .maybeSingle();
    if (entitlementError) throw entitlementError;

    const monthlyAiUnits = entitlement?.monthly_ai_units ?? 10;
    const { data: events, error: usageError } = await client
      .from("ai_usage_events")
      .select("units")
      .eq("user_id", user.id)
      .eq("status", "succeeded")
      .gte("created_at", currentMonthStart());
    if (usageError) throw usageError;

    const used = (events ?? []).reduce((total, event) => total + Number(event.units ?? 0), 0);
    if (!hasAvailableAiUnits(monthlyAiUnits, used)) {
      throw new AiQuotaExceededError();
    }

    return { client, userId: user.id, featureKey };
  } catch (error) {
    if (error instanceof AiQuotaExceededError) throw error;
    // Supabase 短暂不可达时不应让诊断整条链路失败
    if (isTransientNetworkError(error)) {
      console.warn("[prepareAiUsage] skip quota due to network error", error);
      return null;
    }
    throw error;
  }
}

export async function recordAiUsage(
  context: AiUsageContext | null,
  status: "succeeded" | "failed",
): Promise<void> {
  if (!context) return;

  const { error } = await context.client.from("ai_usage_events").insert({
    user_id: context.userId,
    feature_key: context.featureKey,
    units: 1,
    model: process.env.LLM_MODEL ?? null,
    status,
  });
  if (error) throw error;
}

import { NextResponse } from "next/server";
import { WebhookEventType } from "@waffo/pancake-ts";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWaffoClient } from "@/lib/waffo/client";
import { getWaffoEnvironment } from "@/lib/waffo/config";
import { planFromWebhookEvent, resolveBuyerUserId } from "@/lib/waffo/entitlements";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-waffo-signature");

  let event;
  try {
    event = getWaffoClient().webhooks.verify(rawBody, signature, {
      environment: getWaffoEnvironment(),
    });
  } catch (error) {
    console.error("[waffo-webhook] invalid signature", error);
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.error("[waffo-webhook] missing SUPABASE_SERVICE_ROLE_KEY");
    return new NextResponse("Server misconfigured", { status: 503 });
  }

  const { error: insertError } = await admin.from("waffo_webhook_events").insert({
    id: event.id,
    event_type: event.eventType,
    payload: event as unknown as Record<string, unknown>,
  });
  if (insertError) {
    if (insertError.code === "23505") return new NextResponse("OK");
    console.error("[waffo-webhook] dedup insert", insertError);
    return new NextResponse("Persist failed", { status: 500 });
  }

  const data = event.data as {
    merchantProvidedBuyerIdentity?: string;
    orderMetadata?: Record<string, string>;
    orderId?: string;
    orderStatus?: string;
  };
  const plan = planFromWebhookEvent(event.eventType);
  const userId = resolveBuyerUserId({
    merchantProvidedBuyerIdentity: data.merchantProvidedBuyerIdentity,
    orderMetadata: data.orderMetadata,
  });

  if (plan && userId) {
    const { error: updateError } = await admin
      .from("user_entitlements")
      .update({
        plan_key: plan.planKey,
        monthly_ai_units: plan.monthlyAiUnits,
        waffo_order_id: data.orderId,
        waffo_status: data.orderStatus ?? event.eventType,
        period_started_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (updateError) {
      console.error("[waffo-webhook] entitlement update", updateError);
      return new NextResponse("Entitlement update failed", { status: 500 });
    }
  } else if (
    event.eventType === WebhookEventType.SubscriptionActivated ||
    event.eventType === WebhookEventType.OrderCompleted
  ) {
    console.warn("[waffo-webhook] missing user mapping", event.eventType);
  }

  return new NextResponse("OK");
}

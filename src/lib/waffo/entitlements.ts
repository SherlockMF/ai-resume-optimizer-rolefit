export const PRO_MONTHLY_AI_UNITS = 100;
export const FREE_MONTHLY_AI_UNITS = 10;

export type BillingPlanKey = "free" | "pro";

export function planFromWebhookEvent(eventType: string): {
  planKey: BillingPlanKey;
  monthlyAiUnits: number;
} | null {
  switch (eventType) {
    case "order.completed":
    case "subscription.activated":
    case "subscription.payment_succeeded":
    case "subscription.uncanceled":
    case "subscription.updated":
      return { planKey: "pro", monthlyAiUnits: PRO_MONTHLY_AI_UNITS };
    case "subscription.canceled":
    case "refund.succeeded":
      return { planKey: "free", monthlyAiUnits: FREE_MONTHLY_AI_UNITS };
    default:
      return null;
  }
}

export function resolveBuyerUserId(data: {
  merchantProvidedBuyerIdentity?: string;
  orderMetadata?: Record<string, string>;
}): string | null {
  const fromIdentity = data.merchantProvidedBuyerIdentity?.trim();
  if (fromIdentity && isUuid(fromIdentity)) return fromIdentity;
  const fromMeta = data.orderMetadata?.userId?.trim();
  if (fromMeta && isUuid(fromMeta)) return fromMeta;
  return null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

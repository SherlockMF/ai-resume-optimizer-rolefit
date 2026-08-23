import { describe, expect, it } from "vitest";
import { planFromWebhookEvent, resolveBuyerUserId } from "./entitlements";

describe("Waffo entitlement mapping", () => {
  it("upgrades to pro on activation and renewal", () => {
    expect(planFromWebhookEvent("subscription.activated")?.planKey).toBe("pro");
    expect(planFromWebhookEvent("subscription.payment_succeeded")?.monthlyAiUnits).toBe(
      100,
    );
  });

  it("returns to free on cancel or refund", () => {
    expect(planFromWebhookEvent("subscription.canceled")?.planKey).toBe("free");
    expect(planFromWebhookEvent("refund.succeeded")?.monthlyAiUnits).toBe(10);
  });

  it("ignores canceling and past_due until terminal", () => {
    expect(planFromWebhookEvent("subscription.canceling")).toBeNull();
    expect(planFromWebhookEvent("subscription.past_due")).toBeNull();
  });

  it("resolves user id from identity or metadata", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(resolveBuyerUserId({ merchantProvidedBuyerIdentity: id })).toBe(id);
    expect(resolveBuyerUserId({ orderMetadata: { userId: id } })).toBe(id);
    expect(resolveBuyerUserId({ merchantProvidedBuyerIdentity: "not-a-user" })).toBeNull();
  });
});

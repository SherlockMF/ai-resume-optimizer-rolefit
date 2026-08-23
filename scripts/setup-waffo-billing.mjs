import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { WaffoPancake, BillingPeriod, TaxCategory } from "@waffo/pancake-ts";

function loadEnvFile(fileName: string) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

function privateKey(): string {
  const b64 = process.env.WAFFO_PRIVATE_KEY_BASE64?.trim();
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  return required("WAFFO_PRIVATE_KEY");
}

const client = new WaffoPancake({
  merchantId: required("WAFFO_MERCHANT_ID"),
  privateKey: privateKey(),
  environment: "test",
});

const storeId = required("WAFFO_STORE_ID");

const monthly = await client.subscriptionProducts.create({
  storeId,
  name: "RoleFit Pro Monthly",
  billingPeriod: BillingPeriod.Monthly,
  prices: {
    USD: { amount: "9.99", taxCategory: TaxCategory.Saas },
  },
  metadata: { plan: "monthly" },
});

const yearly = await client.subscriptionProducts.create({
  storeId,
  name: "RoleFit Pro Yearly",
  billingPeriod: BillingPeriod.Yearly,
  prices: {
    USD: { amount: "99.00", taxCategory: TaxCategory.Saas },
  },
  metadata: { plan: "yearly" },
});

console.log("WAFFO_PRO_MONTHLY_PRODUCT_ID=" + monthly.product.id);
console.log("WAFFO_PRO_YEARLY_PRODUCT_ID=" + yearly.product.id);

const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://lomivex.top").replace(/\/$/, "");
const webhookUrl = `${origin}/api/webhooks/waffo`;
try {
  const { webhook } = await client.webhooks.add({
    storeId,
    channel: "http",
    url: webhookUrl,
    events: [
      "order.completed",
      "subscription.activated",
      "subscription.payment_succeeded",
      "subscription.canceled",
      "subscription.uncanceled",
      "refund.succeeded",
    ],
    testMode: true,
  });
  console.log("Webhook registered:", webhook.id, webhookUrl);
} catch (error) {
  console.warn("Webhook registration skipped or failed:", error);
}

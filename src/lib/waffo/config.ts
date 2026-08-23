import "server-only";

export type WaffoEnvironment = "test" | "prod";

export function getWaffoEnvironment(): WaffoEnvironment {
  const raw = process.env.WAFFO_ENVIRONMENT?.trim().toLowerCase();
  return raw === "prod" || raw === "production" ? "prod" : "test";
}

export function getWaffoMerchantId(): string {
  const id = process.env.WAFFO_MERCHANT_ID?.trim();
  if (!id) throw new Error("未配置 WAFFO_MERCHANT_ID");
  return id;
}

export function getWaffoStoreId(): string {
  const id = process.env.WAFFO_STORE_ID?.trim();
  if (!id) throw new Error("未配置 WAFFO_STORE_ID");
  return id;
}

function rejectPlaceholder(value: string | undefined, name: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("REPLACE_ME")) {
    throw new Error(`请在环境变量中填写真实的 ${name}（当前仍是占位符）`);
  }
  return trimmed;
}

export function getWaffoPrivateKey(): string {
  const b64 = process.env.WAFFO_PRIVATE_KEY_BASE64?.trim();
  if (b64) {
    return Buffer.from(rejectPlaceholder(b64, "WAFFO_PRIVATE_KEY_BASE64"), "base64").toString(
      "utf8",
    );
  }
  return rejectPlaceholder(process.env.WAFFO_PRIVATE_KEY, "WAFFO_PRIVATE_KEY");
}

export function getWaffoProductId(plan: "monthly" | "yearly"): string {
  const name =
    plan === "yearly" ? "WAFFO_PRO_YEARLY_PRODUCT_ID" : "WAFFO_PRO_MONTHLY_PRODUCT_ID";
  return rejectPlaceholder(process.env[name], name);
}

export function getAppOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://lomivex.top";
}

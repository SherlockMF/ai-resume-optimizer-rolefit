import { NextResponse } from "next/server";
import { z } from "zod";
import { WaffoPancakeError } from "@waffo/pancake-ts";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getWaffoClient } from "@/lib/waffo/client";
import { getAppOrigin, getWaffoProductId } from "@/lib/waffo/config";

export const maxDuration = 30;

const bodySchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "请选择月付或年付套餐" }, { status: 400 });
    }

    const supabase = await getServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "云端未配置，无法发起支付" }, { status: 503 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "请先登录后再开通 Pro" }, { status: 401 });
    }

    const origin = getAppOrigin(request);
    const session = await getWaffoClient().checkout.authenticated.create({
      productId: getWaffoProductId(parsed.data.plan),
      currency: "USD",
      buyerIdentity: user.id,
      buyerEmail: user.email ?? undefined,
      successUrl: `${origin}/billing?checkout=success`,
      metadata: { userId: user.id, plan: parsed.data.plan },
      orderMerchantExternalId: `rolefit-${user.id.slice(0, 8)}-${parsed.data.plan}`,
    });

    return NextResponse.json({
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    if (error instanceof WaffoPancakeError) {
      const message = error.errors[0]?.message ?? error.message;
      console.error("[waffo-checkout]", error.status, error.errors);
      return NextResponse.json({ error: message }, { status: error.status || 400 });
    }
    const message = error instanceof Error ? error.message : "创建支付会话失败";
    console.error("[waffo-checkout]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

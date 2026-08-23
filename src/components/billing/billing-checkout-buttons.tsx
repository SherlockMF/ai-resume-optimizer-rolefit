"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { openAuthDialog } from "@/lib/auth/auth-dialog";

type Plan = "monthly" | "yearly";

export function BillingCheckoutButtons({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [pending, setPending] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    setError(null);
    if (!isLoggedIn) {
      openAuthDialog({ onSuccess: () => void startCheckout(plan) });
      return;
    }
    setPending(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "无法创建支付会话");
      }
      window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付发起失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="lg"
          disabled={pending !== null}
          onClick={() => void startCheckout("monthly")}
        >
          {pending === "monthly" ? "跳转中…" : "开通月付 Pro · $9.99"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={pending !== null}
          onClick={() => void startCheckout("yearly")}
        >
          {pending === "yearly" ? "跳转中…" : "开通年付 Pro · $99"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        支付页会在新标签打开。开通即表示你同意
        <Link className="underline" href="/terms">
          服务条款
        </Link>
        与
        <Link className="underline" href="/privacy">
          隐私政策
        </Link>
        。测试卡：4576 7500 0000 0110，任意未来有效期与 CVC。
      </p>
    </div>
  );
}

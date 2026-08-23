import { SiteHeader } from "@/components/layout/site-header";
import { BillingCheckoutButtons } from "@/components/billing/billing-checkout-buttons";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let planKey = "free";
  let monthlyAiUnits = 10;
  if (supabase && user) {
    const { data } = await supabase
      .from("user_entitlements")
      .select("plan_key, monthly_ai_units, waffo_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      planKey = data.plan_key ?? "free";
      monthlyAiUnits = data.monthly_ai_units ?? 10;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs text-muted-foreground">RoleFit Pro</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">订阅与额度</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          方案与标价见下方。免费每月 10 次 AI；Pro 每月 100 次。月付 $9.99、年付 $99（美元，按周期自动续费）。公开说明也可在
          <a className="underline" href="/pricing">
            定价页
          </a>
          查看，无需登录。
        </p>

        {checkout === "success" ? (
          <p className="mt-4 max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            已从支付页返回。Webhook 确认后套餐会自动升级；请稍候刷新本页。
          </p>
        ) : null}

        <div className="mt-8">
          <PricingPlans />
        </div>

        <section className="mt-8 max-w-3xl rounded-xl border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">当前套餐</p>
          <p className="mt-1 text-xl font-medium">
            {planKey === "pro" ? "Pro" : "免费"} · 每月 {monthlyAiUnits} 次 AI
          </p>
          {!user ? (
            <p className="mt-2 text-sm text-muted-foreground">登录后才能开通并同步额度。</p>
          ) : null}
        </section>

        <section className="mt-6 rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg font-medium">开通 Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            由 Waffo Pancake 托管结账（测试环境）。支付成功后通过 Webhook 写入云端额度。
          </p>
          <div className="mt-5">
            <BillingCheckoutButtons isLoggedIn={Boolean(user)} />
          </div>
        </section>
      </main>
    </div>
  );
}

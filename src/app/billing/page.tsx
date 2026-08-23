import { SiteHeader } from "@/components/layout/site-header";
import { BillingCheckoutButtons } from "@/components/billing/billing-checkout-buttons";
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
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs text-muted-foreground">RoleFit Pro</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">订阅与额度</h1>
        <p className="mt-3 text-muted-foreground">
          免费用户每月 10 次 AI 调用。Pro 提升到 100 次/月，覆盖诊断、终稿、在线主页生成等。
        </p>

        {checkout === "success" ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            已从支付页返回。Webhook 确认后套餐会自动升级；请稍候刷新本页。
          </p>
        ) : null}

        <section className="mt-8 rounded-xl border border-border bg-background p-6">
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

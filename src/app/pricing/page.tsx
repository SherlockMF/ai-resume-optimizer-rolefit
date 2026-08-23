import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { PRICING, SITE_SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "定价 | RoleFit",
  description:
    "RoleFit 免费版与 Pro 订阅价格、额度与计费周期说明。月付 $9.99，年付 $99。",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs text-muted-foreground">公开定价</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">方案与价格</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          购买前可在此查看套餐、标价与计费周期。开通在「订阅」页完成，需登录；价格与下方公示一致。
        </p>
        <div className="mt-10">
          <PricingPlans />
        </div>
        <section className="mt-12 max-w-3xl space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-medium text-foreground">计费说明</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              免费版 {PRICING.free.priceLabel}，{PRICING.free.cycle}；每月{" "}
              {PRICING.free.aiUnits} 次 AI。
            </li>
            <li>
              Pro 月付 {PRICING.proMonthly.priceLabel}/{PRICING.currency}，
              {PRICING.proMonthly.cycle}；Pro 年付 {PRICING.proYearly.priceLabel}/
              {PRICING.currency}，{PRICING.proYearly.cycle}（{PRICING.proYearly.note}）。
            </li>
            <li>AI 额度按自然月重置；Pro 为 100 次/月，覆盖诊断、终稿、在线主页生成等。</li>
            <li>结账由 Waffo Pancake 托管。测试环境请使用官方测试卡，勿用真实银行卡。</li>
            <li>
              价格疑问请发邮件至{" "}
              <a className="underline" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
                {SITE_SUPPORT_EMAIL}
              </a>
              。
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

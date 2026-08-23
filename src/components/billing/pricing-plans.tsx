import { ButtonLink } from "@/components/ui/button";
import { PRICING } from "@/lib/site";

const plans = [
  {
    id: "free",
    name: PRICING.free.name,
    price: PRICING.free.priceLabel,
    cycle: PRICING.free.cycle,
    highlight: false,
    features: [
      `每月 ${PRICING.free.aiUnits} 次 AI 调用`,
      "岗位匹配诊断、追问与终稿",
      "在线求职主页（基础额度内）",
      "投递看板与岗位版本",
    ],
    ctaHref: "/optimizer",
    ctaLabel: "免费开始",
  },
  {
    id: "monthly",
    name: PRICING.proMonthly.name,
    price: PRICING.proMonthly.priceLabel,
    cycle: PRICING.proMonthly.cycle,
    highlight: true,
    features: [
      `每月 ${PRICING.proMonthly.aiUnits} 次 AI 调用`,
      "覆盖诊断、终稿、在线主页生成",
      "登录后即可开通，额度云端同步",
      "可随时停止续费，当期权益用至周期结束",
    ],
    ctaHref: "/billing",
    ctaLabel: "去开通月付",
  },
  {
    id: "yearly",
    name: PRICING.proYearly.name,
    price: PRICING.proYearly.priceLabel,
    cycle: PRICING.proYearly.cycle,
    highlight: false,
    features: [
      `每月 ${PRICING.proYearly.aiUnits} 次 AI 调用（年付套餐）`,
      "与月付 Pro 功能相同",
      PRICING.proYearly.note,
      "适合长期使用，一次支付覆盖 12 个月",
    ],
    ctaHref: "/billing",
    ctaLabel: "去开通年付",
  },
] as const;

export function PricingPlans() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`flex flex-col rounded-xl border bg-background p-6 ${
            plan.highlight ? "border-foreground/30 shadow-sm" : "border-border"
          }`}
        >
          <h3 className="text-sm font-medium text-muted-foreground">{plan.name}</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{plan.price}</p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.cycle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            标价币种：{PRICING.currencyLabel}（{PRICING.currency}）
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
            {plan.features.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <ButtonLink
            href={plan.ctaHref}
            variant={plan.highlight ? "default" : "outline"}
            className="mt-6 h-9 justify-center"
          >
            {plan.ctaLabel}
          </ButtonLink>
        </article>
      ))}
    </div>
  );
}

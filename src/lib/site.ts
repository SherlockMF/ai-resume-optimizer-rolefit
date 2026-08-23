/** 站点公示客服联系方式（页脚、条款与隐私政策共用） */
export const SITE_SUPPORT_EMAIL = "847542343@qq.com";
export const SITE_ORIGIN = "https://lomivex.top";

/** 对外公示的订阅价格（与结账商品一致，币种 USD） */
export const PRICING = {
  currency: "USD",
  currencyLabel: "美元",
  free: {
    name: "免费版",
    priceLabel: "$0",
    cycle: "无需付费，长期可用",
    aiUnits: 10,
  },
  proMonthly: {
    name: "Pro 月付",
    priceLabel: "$9.99",
    cycle: "按月计费，到期自动续费",
    aiUnits: 100,
  },
  proYearly: {
    name: "Pro 年付",
    priceLabel: "$99",
    cycle: "按年计费，到期自动续费",
    aiUnits: 100,
    note: "约合每月 $8.25",
  },
} as const;

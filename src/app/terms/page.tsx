import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE_SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "服务条款 | RoleFit",
  description: "RoleFit 网站与相关服务的使用条款。",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-xs text-muted-foreground">生效日期：2026 年 8 月 23 日</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">服务条款</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-medium">1. 协议范围</h2>
            <p>
              欢迎使用 RoleFit（以下简称「本服务」，网站：https://lomivex.top）。访问或使用本服务，即表示你同意本条款。若不同意，请停止使用。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">2. 服务内容</h2>
            <p>
              RoleFit 提供面向求职场景的简历诊断、改写建议、投递记录、在线求职主页生成及付费订阅等功能。功能可能随版本调整。AI
              输出仅为辅助，不构成录用承诺、法律意见或职业规划保证。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">3. 账户</h2>
            <p>
              部分功能需登录。你应妥善保管账户凭据，并对该账户下的操作负责。我们有权在发现违规、欺诈或安全风险时限制或终止账户。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">4. 用户内容与真实性</h2>
            <p>
              你上传或输入的简历、职位描述、项目经历等内容由你享有相应权利，并授权我们仅为提供本服务之目的进行处理（含发送给第三方大模型服务商生成结果）。你保证内容合法、属实，不得利用本服务编造履历或侵害他人权益。面试与录用结果由用人单位决定，与本服务无关。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">5. 在线求职主页</h2>
            <p>
              你可将求职主页设为公开。公开后，任何持有链接的人均可访问你选择展示的信息。请自行评估公开范围；取消发布后，已传播的链接可能仍被第三方缓存。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">6. 付费与额度</h2>
            <p>
              Pro 等付费项目由第三方支付服务（当前为 Waffo Pancake）托管结账。价格、计费周期与测试/正式环境以结账页展示为准。支付成功后的权益以账户内记录及我们收到的支付通知为准。除非适用法律另有强制规定，已开通额度一般不支持折现退款；测试环境请使用官方测试卡，勿使用真实银行卡。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">7. 禁止行为</h2>
            <p>
              不得滥用、攻击、爬取本服务，不得上传恶意文件或违法内容，不得绕过用量限制或干扰其他用户。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">8. 免责声明</h2>
            <p>
              本服务按「现状」提供。在法律允许范围内，我们不对服务中断、数据丢失、第三方模型错误、支付通道故障或因你依赖 AI
              建议而产生的任何间接损失承担责任。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">9. 条款变更</h2>
            <p>
              我们可能更新本条款，更新后公布于本页面。继续使用即视为接受修订后的条款。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">10. 联系</h2>
            <p>
              与本条款相关的问题，请发送邮件至{" "}
              <a className="underline" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
                {SITE_SUPPORT_EMAIL}
              </a>
              。隐私处理见
              <Link className="underline" href="/privacy">
                隐私政策
              </Link>
              。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

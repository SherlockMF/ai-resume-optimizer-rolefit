import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "隐私政策 | RoleFit",
  description: "RoleFit 如何收集、使用与保护你的个人信息。",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-xs text-muted-foreground">生效日期：2026 年 8 月 23 日</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">隐私政策</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-medium">1. 引言</h2>
            <p>
              RoleFit（https://lomivex.top）重视你的个人信息。本政策说明我们收集哪些信息、如何使用，以及你可行使的权利。使用本服务即表示你已阅读本政策。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">2. 我们收集的信息</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">账户信息：</span>
                登录所使用的电子邮箱等身份标识（由 Supabase Auth 处理）。
              </li>
              <li>
                <span className="text-foreground">你提交的求职材料：</span>
                简历文本或解析结果、职位描述、目标岗位与公司、追问补充、投递看板记录、在线主页文案与主题等。
              </li>
              <li>
                <span className="text-foreground">本地数据：</span>
                未登录或未同步时，历史诊断、岗位版本等可能仅保存在你的浏览器（localStorage）。
              </li>
              <li>
                <span className="text-foreground">支付相关：</span>
                开通 Pro 时，结账由 Waffo Pancake 处理。我们接收订单状态、支付结果等业务字段以开通额度，不主动存储完整银行卡号。
              </li>
              <li>
                <span className="text-foreground">技术日志：</span>
                托管平台可能记录 IP、浏览器类型、请求路径等，用于安全与故障排查。
              </li>
            </ul>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">3. 使用目的</h2>
            <p>
              用于提供诊断与生成、同步云端数据、发布你选择公开的主页、计量 AI 调用次数、处理订阅、改进服务与保障安全。我们不会出售你的个人信息。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">4. 第三方处理</h2>
            <p>
              为实现功能，数据可能被发送至：大模型 API 提供商（生成诊断与文案）、Supabase（账户与数据库）、Netlify（网站托管）、Waffo
              Pancake（支付）。上述服务各自适用其隐私政策，并可能位于你所在司法辖区之外。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">5. 公开信息</h2>
            <p>
              若你发布在线求职主页，你勾选展示的姓名、经历、联系方式等将对任何访问该链接的人可见。请勿在公开页填写不希望公开的敏感信息。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">6. Cookie 与本地存储</h2>
            <p>
              我们使用登录会话 Cookie（或同类技术）维持登录状态，并使用浏览器本地存储保存草稿与历史。你可通过浏览器清除上述数据；清除后未同步的内容可能无法恢复。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">7. 保存期限</h2>
            <p>
              账户与云端数据在你使用本服务期间保存；你可删除公开页或停止使用账户。备份、日志与支付凭证可能按法律或反欺诈需要保留更长时间。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">8. 你的选择</h2>
            <p>
              你可以拒绝提供非必要信息（部分功能将不可用）、停止公开主页、退出登录或清除本机数据。如需删除云端账户数据，请通过站点运营方可联系渠道提出请求，我们将在核实身份后处理，法律法规要求保留的除外。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">9. 未成年人</h2>
            <p>本服务面向求职成年人。若你未满 18 周岁，请在监护人同意下使用，或不要使用本服务。</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-medium">10. 政策更新</h2>
            <p>政策更新将发布于本页。重大变更时，我们可能通过站点提示。继续使用即表示你了解更新后的政策。</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

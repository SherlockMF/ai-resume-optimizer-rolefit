import {
  ArrowRight,
  ClipboardCheck,
  Globe,
  MessageCircleQuestion,
  Search,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";

const steps = [
  {
    icon: Upload,
    title: "上传简历与 JD",
    description: "粘贴或上传 PDF/DOCX 简历，并粘贴目标 AI 产品经理岗位 JD。",
  },
  {
    icon: Search,
    title: "岗位匹配诊断",
    description:
      "多维度评分、关键词覆盖、ATS 检测、能力缺口与投递策略，不只是润色文字。",
  },
  {
    icon: MessageCircleQuestion,
    title: "量化追问补充",
    description:
      "AI 追问项目数据与贡献边界，你再确认真实性后生成终稿，避免空话与过度包装。",
  },
  {
    icon: ClipboardCheck,
    title: "终稿与面试准备",
    description:
      "人工版 + ATS 版简历、逐条改写对比、面试追问预测，提高拿面试的概率。",
  },
];

const capabilities = [
  {
    icon: ShieldAlert,
    title: "风险排雷",
    desc: "识别过度包装与面试翻车风险，建议降级表达",
  },
  {
    icon: Search,
    title: "岗位匹配",
    desc: "JD 关键词覆盖、能力缺口、优先修改项",
  },
  {
    icon: MessageCircleQuestion,
    title: "面试追问",
    desc: "根据简历 bullet 预测面试官可能问什么",
  },
  {
    icon: Globe,
    title: "在线求职主页",
    desc: "AI 生成可换主题的分享页，公开链接无需登录即可打开",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,120,120,0.08),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              RoleFit · 面向转行求职者 · 示例：城市规划师 → AI 产品经理
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
              不是把简历写得更漂亮，
              <br />
              而是让它更容易拿到面试
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              岗位匹配、经历转译、量化追问、ATS 排雷、面试准备——一套围绕「提高面试转化率」设计的
              AI 简历工作台，而非一次性润色工具。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/optimizer" size="lg" className="h-10 px-5">
                开始匹配诊断
                <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/online-resume" variant="outline" size="lg" className="h-10 px-5">
                生成在线主页
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-sm font-medium text-muted-foreground">
            四步完成优化
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-border/80 bg-background p-6 shadow-none"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <step.icon className="size-4 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-8">
              核心能力
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-border/80 bg-background p-6"
                >
                  <c.icon className="size-5 text-muted-foreground mb-3" />
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-xs text-muted-foreground">
              所有优化建议需你确认真实性；历史记录保存在本浏览器（最多 20 条，侧栏展示 5 条）。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

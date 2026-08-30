import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "更新日志 | RoleFit",
  description: "查看 RoleFit 的产品更新、功能改进与版本记录。",
  alternates: {
    canonical: "/changelog",
  },
};

function loadChangelog(): string {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "# 更新日志\n\n暂无内容。";
  }
}

export default function ChangelogPage() {
  const md = loadChangelog();

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {md}
        </pre>
      </main>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 简历优化与 JD 匹配 | RoleFit",
  description:
    "使用 RoleFit 进行岗位 JD 匹配诊断、ATS 检测、经历改写、量化追问与面试准备。",
  alternates: {
    canonical: "/optimizer",
  },
};

export default function OptimizerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

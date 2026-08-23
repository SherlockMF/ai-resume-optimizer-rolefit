import type { GenerateOnlineResumeRequest } from "@/lib/types/online-resume";

export function buildOnlineResumePrompt(input: GenerateOnlineResumeRequest): {
  system: string;
  user: string;
} {
  const roleHint = input.targetRole
    ? `目标岗位：${input.targetRole}。定位句与项目叙事要服务该岗位。`
    : "根据简历推断合理求职定位。";
  const fromHint = input.currentRole
    ? `候选人当前/原背景：${input.currentRole}。若属转行，用可迁移能力叙事。`
    : "";

  const system = `你是求职主页文案顾问。把简历改写成「个人求职主页 / Portfolio」结构化 JSON，而不是 PDF 简历复刻。

要求：
- 文案短句、可扫读；突出定位、优势、项目故事、技能与行动按钮。
- 禁止堆砌职责清单式长段；项目 2–4 个，优势 3–6 条。
- CTA 至少 1 个，href 可用 mailto: 或 #contact。
- 只输出合法 JSON，不要 markdown 代码块。

JSON schema:
{
  "content": {
    "profile": { "displayName": string, "headline": string, "location"?: string, "avatarUrl"?: string },
    "positioning": string,
    "highlights": string[],
    "about": string,
    "experience": [{ "company": string, "role": string, "period": string, "bullets": string[] }],
    "projects": [{ "name": string, "summary": string, "tags"?: string[], "link"?: string }],
    "skills": { "groups": [{ "name": string, "items": string[] }] },
    "contact": { "email"?: string, "phone"?: string, "website"?: string, "linkedin"?: string, "github"?: string, "wechat"?: string },
    "ctas": [{ "label": string, "href": string, "style": "primary"|"secondary" }],
    "sectionsVisible": { "about": true, "experience": true, "projects": true, "skills": true, "contact": true }
  },
  "suggestedTitle": string,
  "suggestedThemeId": "clean"|"product"|"creative"|"tech"
}

${roleHint}
${fromHint}`;

  const user = `候选人姓名提示：${input.displayNameHint ?? "从简历推断"}

简历原文：
${input.resumeText}`;

  return { system, user };
}

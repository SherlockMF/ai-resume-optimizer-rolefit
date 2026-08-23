import { createLLMClient } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/extract-json";
import { buildOnlineResumePrompt } from "@/lib/ai/prompts-online-resume";
import {
  createEmptyOnlineResumeContent,
  generateOnlineResumeResponseSchema,
  type GenerateOnlineResumeRequest,
  type GenerateOnlineResumeResponse,
} from "@/lib/types/online-resume";

function mockOnlineResume(
  input: GenerateOnlineResumeRequest,
): GenerateOnlineResumeResponse {
  const name = input.displayNameHint?.trim() || "张三";
  const role = input.targetRole?.trim() || "AI产品经理";
  const content = createEmptyOnlineResumeContent({
    profile: {
      displayName: name,
      headline: `${role}｜可落地的跨界候选人`,
      location: "杭州",
    },
    positioning: `从${input.currentRole ?? "原专业背景"}转向${role}，擅长把复杂协作与调研经验转译为产品推进力。`,
    highlights: [
      "跨部门协调与多方推进",
      "调研与需求梳理可映射用户研究",
      "有数字化/智慧场景落地素材",
      "表达清晰，便于面试核验",
    ],
    about: `我正在系统补齐产品方法论，并用真实项目证明迁移能力。目标是加入重视落地与学习速度的${role}团队。`,
    projects: [
      {
        name: "智慧城市需求清单落地",
        summary:
          "协助梳理政务平台需求并与数据侧对接，沉淀可追踪的需求条目与验收口径。",
        tags: ["需求", "跨部门", "数字化"],
      },
      {
        name: "片区规划多方意见闭环",
        summary:
          "组织评审与意见征询，建立采纳与方案迭代机制，锻炼优先级判断与推进节奏。",
        tags: ["协作", "复盘"],
      },
    ],
    skills: {
      groups: [
        { name: "产品与协作", items: ["需求分析", "跨团队推进", "文档表达"] },
        { name: "研究与数据", items: ["调研访谈", "数据分析意识", "复盘"] },
      ],
    },
    contact: { email: "hello@example.com" },
    ctas: [
      { label: "约面聊一聊", href: "mailto:hello@example.com", style: "primary" },
      { label: "查看项目", href: "#contact", style: "secondary" },
    ],
  });

  return {
    content,
    suggestedTitle: `${name} · ${role}主页`,
    suggestedThemeId: "product",
  };
}

export async function generateOnlineResume(
  input: GenerateOnlineResumeRequest,
): Promise<GenerateOnlineResumeResponse> {
  const provider = process.env.LLM_PROVIDER?.trim() ?? "mock";
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (provider === "mock" || !apiKey) {
    return mockOnlineResume(input);
  }

  const { system, user } = buildOnlineResumePrompt(input);
  const client = createLLMClient();
  const raw = await client.complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.45, maxTokens: 4500, jsonMode: true },
  );
  return parseAiJson(raw, generateOnlineResumeResponseSchema);
}

import type { DiagnoseRequest } from "@/lib/types/diagnose";
import type { RefineRequest } from "@/lib/types/refine";
import { formatTargetContext } from "@/lib/ai/context";
import {
  formatProfileForPrompt,
  getProfileDimensions,
  resolveRoleProfile,
} from "@/lib/optimizer/role-profiles";

const CORE_RULES = `核心原则：
1. 绝不编造用户没有的经历、项目、公司、数据或成果。
2. 只做「转译」与「结构化」：帮助转行求职者把已有经历映射到目标岗位。
3. 使用 JD 关键词，但只建议用户真实具备或可合理映射的能力。
4. 输出必须是合法 JSON，不要 markdown 代码块包裹。
5. 对过度包装表达给出 interviewRisk 提示。`;

export function buildDiagnosePrompt(input: DiagnoseRequest): {
  system: string;
  user: string;
} {
  const profile = resolveRoleProfile(input.targetRole);
  const dimensionList = getProfileDimensions(profile);
  const profileBlock = formatProfileForPrompt(profile);

  const system = `你是一位专注「提高面试转化率」的中文简历顾问，帮助求职者从「${input.currentRole}」转向「${input.targetRole}」。

${CORE_RULES}

本次任务：仅做诊断与追问设计，不要生成完整优化简历。

${profileBlock}

JSON schema:
{
  "overallScore": number,
  "matchSummary": string,
  "strengths": string[],
  "issues": string[],
  "careerChangeRisks": string[],
  "hrEvaluation": string,
  "dimensionScores": [{ "dimension": string, "score": number, "reason": string }],
  "jdMatch": {
    "overall": number,
    "keywordCoverage": number,
    "capabilityGaps": string[],
    "priorityFixes": string[]
  },
  "keywords": { "matched": string[], "missing": string[], "suggested": string[] },
  "atsChecklist": [{ "item": string, "status": "pass"|"warn"|"fail", "suggestion"?: string }],
  "lowValuePatterns": string[],
  "rewriteSuggestions": [{
    "id": string,
    "original": string,
    "issues": string[],
    "followUpQuestions": string[],
    "optimizedConservative"?: string,
    "interviewRisk"?: string
  }],
  "followUpQuestionsGlobal": string[],
  "applicationStrategy": { "worthApplying": "high"|"medium"|"low", "reason": string }
}

dimensionScores 必须包含以下 ${dimensionList.length} 项：${dimensionList.join("、")}。
整体评分 overallScore 请按上述各维度权重加权，并优先以岗位画像的判断标准为准。
rewriteSuggestions 给 4-6 条，每条 id 用 b1,b2...。`;

  const user = `${formatTargetContext(input)}

【候选人简历】
${input.originalResumeText}

【目标岗位 JD】
${input.targetJobDescription}

请返回诊断 JSON。若提供了目标公司/行业，请在 matchSummary 与 applicationStrategy 中体现针对性建议。`;

  return { system, user };
}

export function buildRefinePrompt(input: RefineRequest): {
  system: string;
  user: string;
} {
  const profile = resolveRoleProfile(input.targetRole);
  const refineProfileBlock = profile
    ? "【" + profile.targetRole + " 岗位画像】面试考察点：" + profile.interviewFocus.join("、") + "；典型产出物：" + profile.deliverables.join("、") + "；考核指标：" + profile.metrics.join("、") + "。"
    : "";

  const answersText =
    Object.keys(input.followUpAnswers).length > 0
      ? JSON.stringify(input.followUpAnswers, null, 2)
      : "（用户选择跳过追问，请基于现有信息生成保守版）";

  const system = `你是一位专注「提高面试转化率」的中文简历顾问，帮助求职者从「${input.currentRole}」转向「${input.targetRole}」。

${CORE_RULES}

本次任务：基于诊断结果与用户追问回答，生成终稿简历与面试准备材料。

${refineProfileBlock}

JSON schema:
{
  "optimizedResumeHuman": string,
  "optimizedResumeAts": string,
  "rewriteSuggestionsFinal": [{
    "original": string,
    "optimized": string,
    "reason": string,
    "interviewRisk"?: string
  }],
  "interviewQuestions": [{
    "question": string,
    "relatedBullet": string,
    "suggestedAnswerOutline": string
  }],
  "applicationStrategy"?: { "worthApplying": "high"|"medium"|"low", "reason": string }
}

optimizedResumeHuman 用 Markdown；optimizedResumeAts 为纯文本、关键词密集、无复杂格式，便于 ATS 解析。
interviewQuestions 给 5-8 条。`;

  const user = `${formatTargetContext(input)}

【候选人简历】
${input.originalResumeText}

【目标岗位 JD】
${input.targetJobDescription}

【此前诊断结果】
${JSON.stringify(input.diagnose)}

【用户对追问的回答】
${answersText}

【是否跳过追问】${input.skipFollowUp ? "是" : "否"}

请生成终稿 JSON。`;

  return { system, user };
}

/** @deprecated */
export function buildOptimizeResumePrompt(input: DiagnoseRequest): {
  system: string;
  user: string;
} {
  return buildDiagnosePrompt(input);
}

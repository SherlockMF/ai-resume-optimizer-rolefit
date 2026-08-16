/**
 * 完整演示场景：张三 · 城市规划师 → 字节跳动 AI 产品经理
 * 所有 mock / 示例 / 本地种子数据均由此文件派生，保证前后一致。
 */

import type { DiagnoseResponse } from "@/lib/types/diagnose";
import type { RefineResponse } from "@/lib/types/refine";
import type { OptimizeResumeRequest } from "@/lib/types/resume-optimization";
import type { HistoryExtras } from "@/lib/storage/helpers";
import type { HistoryRecord } from "@/lib/storage/history";
import type { ResumeVersion } from "@/lib/storage/versions";
import type { Application } from "@/lib/storage/applications";
import { deriveTitle } from "@/lib/storage/history";
import { buildVersionLabel } from "@/lib/storage/helpers";

/** 固定 ID，便于演示回跳与种子数据合并 */
export const DEMO_HISTORY_ID = "demo-zhangsan-bytes-ai-pm";
export const DEMO_VERSION_ID = "demo-version-bytes-ai-pm";
export const DEMO_APPLICATION_ID = "demo-app-bytes-ai-pm";

export const DEMO_PERSONA = {
  name: "张三",
  currentRole: "城市规划师",
  employer: "杭州市规划设计研究院",
  targetCompany: "字节跳动",
  targetIndustry: "互联网 / AIGC",
  targetRole: "AI产品经理",
  years: "2018 – 至今（8年）",
  education: "同济大学 | 城市规划 | 硕士 | 2016",
} as const;

/** 可复用的量化事实（诊断追问 → 终稿 → 话术 → 作品集均引用） */
export const DEMO_FACTS = {
  districtArea: "12 平方公里",
  population: "约 85 万常住人口",
  teamSize: "6 人（本人为牵头负责人）",
  approvalDaysBefore: 126,
  approvalDaysAfter: 88,
  approvalImprovement: "约 30%",
  surveyHouseholds: 3200,
  surveyEnterprises: 12,
  chosenPlan: "方案 B",
  reviewRounds: 3,
  reviewComments: 217,
  reviewAdoptionRate: "76%",
  smartCityRequirements: 47,
  smartCityDepartments: "规划局、大数据局、政务服务中心",
  aiLearning:
    "完成「AI 产品经理」系统课程；使用 ChatGPT 辅助整理 8 场用户访谈纪要",
} as const;

export const DEMO_RESUME = `张三 | ${DEMO_PERSONA.currentRole}
${DEMO_PERSONA.employer} | 项目负责人 | ${DEMO_PERSONA.years}

工作经历：
- 负责钱江新城二期片区城市设计及控规编制，协调规划、国土、住建、环保等多部门意见，推动控规批复落地
- 开展人口与产业调研（问卷+深访），支撑规划论证与方案比选
- 组织 3 轮专家评审会与公众意见征询，建立意见采纳与方案迭代闭环
- 参与「智慧城市·政务数字化」专题，协助梳理政务平台需求清单并与大数据局对接

项目亮点（智慧城市）：
- 汇总 47 条业务部门需求，归类为 6 大模块，其中 5 条与 AI 辅助办事场景相关

教育背景：
${DEMO_PERSONA.education}

技能：GIS、Excel 数据分析、需求访谈、跨部门协调、Figma 基础、Prompt 实践`;

export const DEMO_JD = `【${DEMO_PERSONA.targetCompany}】岗位：${DEMO_PERSONA.targetRole}

岗位职责：
1. 负责 AI 产品需求分析、规划与迭代，撰写 PRD，定义 MVP 与迭代节奏
2. 协同算法、研发、设计推进产品落地，设计并复盘 A/B 测试
3. 开展用户调研与数据分析，用指标驱动产品决策
4. 跟踪大模型 / AIGC / 智能体行业动态与竞品

任职要求：
1. 3 年以上产品经理经验，有 B 端或平台型产品经验优先
2. 熟悉用户研究、原型设计、数据分析方法
3. 具备良好的跨部门沟通与项目推进能力
4. 对 LLM、智能体、Prompt 工程有了解或实践者优先

团队：飞书协同 · 北京/杭州`;

export const DEMO_FORM: OptimizeResumeRequest = {
  originalResumeText: DEMO_RESUME,
  targetJobDescription: DEMO_JD,
  currentRole: DEMO_PERSONA.currentRole,
  targetRole: DEMO_PERSONA.targetRole,
  targetCompany: DEMO_PERSONA.targetCompany,
  targetIndustry: DEMO_PERSONA.targetIndustry,
  language: "zh-CN",
};

/** 与 diagnose.rewriteSuggestions 的 followUp 字段 id 一一对应 */
export const DEMO_FOLLOW_UP_ANSWERS: Record<string, string> = {
  "b1-q0": `片区面积约 ${DEMO_FACTS.districtArea}，服务人口 ${DEMO_FACTS.population}。`,
  "b1-q1": `本人为牵头负责人，核心小组 ${DEMO_FACTS.teamSize}。`,
  "b1-q2": `批复周期从平均 ${DEMO_FACTS.approvalDaysBefore} 天缩短至 ${DEMO_FACTS.approvalDaysAfter} 天（${DEMO_FACTS.approvalImprovement}）。`,
  "b2-q0": `问卷 ${DEMO_FACTS.surveyHouseholds} 户，深访龙头企业 ${DEMO_FACTS.surveyEnterprises} 家。`,
  "b2-q1": `调研结论直接支撑 ${DEMO_FACTS.chosenPlan} 获选，写入批复说明。`,
  "b3-q0": `共 ${DEMO_FACTS.reviewRounds} 轮专家评审，收集意见 ${DEMO_FACTS.reviewComments} 条。`,
  "b3-q1": `经评估后意见采纳率约 ${DEMO_FACTS.reviewAdoptionRate}，多轮修改后定稿。`,
  "global-q0": `智慧城市专题中梳理 ${DEMO_FACTS.smartCityRequirements} 条需求，${DEMO_FACTS.smartCityDepartments} 参与；其中 5 条与 AI 辅助办事相关。`,
  "global-q1": DEMO_FACTS.aiLearning,
  "global-q2": `优先投递 ${DEMO_PERSONA.targetCompany} 等头部互联网 AI 产品岗，接受 B 端平台型业务。`,
};

export function buildDemoDiagnose(): DiagnoseResponse {
  return {
    overallScore: 68,
    matchSummary: `候选人 ${DEMO_PERSONA.name} 在 ${DEMO_PERSONA.employer} 的 8 年复杂项目经验，与 ${DEMO_PERSONA.targetCompany} ${DEMO_PERSONA.targetRole} 所需的「需求洞察—方案设计—跨团队推进—数据验证」高度同构；已有智慧城市需求梳理（${DEMO_FACTS.smartCityRequirements} 条）与 AI 场景接触点，但 PRD / A/B 测试等产品方法论需在简历中显性化。`,
    strengths: [
      `钱江新城二期项目体现 0-1 规划与 ${DEMO_FACTS.teamSize} 跨部门推进，可对标 AI 产品 MVP 落地`,
      `人口产业调研（${DEMO_FACTS.surveyHouseholds} 户+${DEMO_FACTS.surveyEnterprises} 家深访）可转译为用户研究与数据驱动决策`,
      `智慧城市专题已梳理 ${DEMO_FACTS.smartCityRequirements} 条需求，其中 5 条关联 AI 办事场景，与目标公司业务语境接近`,
    ],
    issues: [
      "工作经历仍偏规划专业术语，产品方法论关键词覆盖不足",
      "A/B 测试、PRD 等 JD 硬技能未在简历中显性呈现",
      "转行叙事可更前置，避免 HR 仅看到「城市规划师」头衔",
    ],
    careerChangeRisks: [
      `投递 ${DEMO_PERSONA.targetCompany} 时可能遇到「非互联网产品出身」筛选`,
      "若夸大 AI 实践深度，面试可能追问 Prompt 与指标设计细节",
    ],
    hrEvaluation: `建议「积极跟进」：与 ${DEMO_PERSONA.targetCompany} 飞书协同、平台型 B 端场景有叙事支点；建议在简历首屏写清「规划 → AI 产品」迁移逻辑，并保留智慧城市需求条目的可信度。`,
    dimensionScores: [
      { dimension: "岗位匹配度", score: 70, reason: `JD 关键词覆盖约七成；智慧城市 ${DEMO_FACTS.smartCityRequirements} 条需求可映射平台型产品` },
      { dimension: "产品方法论", score: 58, reason: "PRD、MVP、A/B 测试等产品方法论尚未在简历中显性化" },
      { dimension: "用户研究与数据驱动", score: 72, reason: `人口产业调研（${DEMO_FACTS.surveyHouseholds} 户+${DEMO_FACTS.surveyEnterprises} 家深访）可转译为用户研究` },
      { dimension: "跨团队推进", score: 75, reason: `${DEMO_FACTS.teamSize} 多部门协调与批复落地体现推进能力` },
      { dimension: "成果量化程度", score: 62, reason: "已有片区面积、批复周期、调研样本等素材，需在 bullet 中写全" },
      { dimension: "ATS友好度", score: 66, reason: "缺 PRD、A/B测试、用户研究等 JD 同义词" },
      { dimension: "可信度", score: 78, reason: "量化区间合理，智慧城市条目可面试核验" },
      { dimension: "差异化", score: 68, reason: "跨行业迁移+政务数字化经验是差异点" },
    ],
    jdMatch: {
      overall: 70,
      keywordCoverage: 64,
      capabilityGaps: [
        "JD 强调 A/B 测试与增长实验，简历未显性写出",
        "JD 要求 PRD / 原型，简历仅隐含文档与需求梳理能力",
      ],
      priorityFixes: [
        "首段补充转行叙事，点明目标为字节 AI 产品方向",
        "将钱江新城、调研、智慧城市三条经历改为 STAR 并写入已确认的量化数据",
        "技能区补充 PRD、用户研究、A/B 测试、Prompt",
      ],
    },
    keywords: {
      matched: ["项目管理", "需求分析", "数据分析", "跨部门协作", "用户研究", "Prompt"],
      missing: ["产品规划", "PRD", "MVP", "A/B测试", "大模型", "A/B 测试"],
      suggested: ["敏捷迭代", "数据驱动", "智能体", "用户画像"],
    },
    atsChecklist: [
      { item: "简历为可复制文本", status: "pass" },
      { item: "无复杂双栏布局", status: "pass" },
      { item: "核心关键词覆盖", status: "warn", suggestion: "补充 PRD、A/B 测试、MVP" },
      { item: "文件名规范", status: "warn", suggestion: `建议使用：${DEMO_PERSONA.name}-${DEMO_PERSONA.targetRole}-简历.pdf` },
      { item: "量化成果频率", status: "warn", suggestion: "终稿将补充批复周期、调研样本等数据" },
    ],
    lowValuePatterns: [
      "「负责」出现 4 次，建议改为牵头/推动/交付",
      "智慧城市 bullet 未写清个人贡献占比",
    ],
    rewriteSuggestions: [
      {
        id: "b1",
        original:
          "负责钱江新城二期片区城市设计及控规编制，协调规划、国土、住建、环保等多部门意见，推动控规批复落地",
        issues: ["职责描述为主", "缺面积/人口/周期数据", "个人边界不清"],
        followUpQuestions: [
          "片区涉及多少平方公里或人口规模？",
          "你牵头还是协助？团队几人？",
          "批复周期是否缩短？有无具体比例？",
        ],
        optimizedConservative: `参与钱江新城二期片区城市设计与控规编制，协调多部门意见并推动批复（待补充量化数据）。`,
        interviewRisk: "若写「牵头」需说明决策权与分工",
      },
      {
        id: "b2",
        original:
          "开展人口与产业调研（问卷+深访），支撑规划论证与方案比选",
        issues: ["未写样本量", "未写哪套方案入选"],
        followUpQuestions: ["调研样本量或数据来源？", "调研结论如何影响方案？"],
        optimizedConservative: "开展人口与产业调研，为规划论证提供数据依据。",
        interviewRisk: "低",
      },
      {
        id: "b3",
        original:
          "组织 3 轮专家评审会与公众意见征询，建立意见采纳与方案迭代闭环",
        issues: ["流程描述多", "缺意见条数与采纳率"],
        followUpQuestions: ["评审轮次与意见条数？", "意见采纳率或修改轮次？"],
        interviewRisk: "低",
      },
    ],
    followUpQuestionsGlobal: [
      "是否有智慧城市、数字化平台、大模型试点等相关经历可补充？",
      "近 1 年是否完成 AI 产品 / 数据分析类课程或证书？",
      `期望投递的公司（如 ${DEMO_PERSONA.targetCompany}）与业务方向是否有偏好？`,
    ],
    applicationStrategy: {
      worthApplying: "high",
      reason: `与 ${DEMO_PERSONA.targetCompany} 平台型、跨部门协同场景匹配；智慧城市 ${DEMO_FACTS.smartCityRequirements} 条需求梳理可类比 B 端需求池管理。建议针对性准备产品方法论与 A/B 测试案例。`,
    },
  };
}

export function buildDemoRefine(): RefineResponse {
  const f = DEMO_FACTS;
  const p = DEMO_PERSONA;
  return {
    optimizedResumeHuman: `## 求职意向
${p.targetRole} | ${p.targetCompany} 及平台型 AI 产品方向 | 用户研究 · 跨方协作 · 数据驱动

## 个人总结
8 年城市规划与复杂项目交付经验（${p.employer}），从需求调研、方案设计到多部门落地闭环。已将能力迁移至 AI 产品语境：主导钱江新城二期片区（${f.districtArea}、${f.population}）跨 4 部门推进，批复周期由 ${f.approvalDaysBefore} 天缩短至 ${f.approvalDaysAfter} 天（${f.approvalImprovement}）；智慧城市专题梳理 ${f.smartCityRequirements} 条政务需求，其中 5 条关联 AI 辅助办事。${f.aiLearning}。

## 工作经历
### ${p.employer} | ${p.currentRole} / 项目负责人 | 2018–至今
- **0-1 规划交付**：牵头钱江新城二期片区城市设计与控规（${f.districtArea}、${f.population}），协调规划/国土/住建/环保 4 部门对齐需求，推动批复周期 ${f.approvalDaysBefore}→${f.approvalDaysAfter} 天（${f.approvalImprovement}）
- **用户洞察**：设计并执行人口产业调研（问卷 ${f.surveyHouseholds} 户 + 深访 ${f.surveyEnterprises} 家），结论支撑 ${f.chosenPlan} 入选批复说明
- **迭代闭环**：组织 ${f.reviewRounds} 轮专家评审，收集 ${f.reviewComments} 条意见，采纳率约 ${f.reviewAdoptionRate} 后定稿
- **数字化需求**：参与智慧城市政务数字化专题，梳理 ${f.smartCityRequirements} 条需求（${f.smartCityDepartments}），归类 6 模块并标注 5 条 AI 办事场景

## 项目经历
### 智慧城市·政务数字化需求梳理 | 2024
- 输出需求清单 ${f.smartCityRequirements} 条，对接大数据局评审；个人负责需求访谈纪要与优先级初评

## 教育背景
${p.education}

## 技能
用户研究 · 需求分析 · PRD · 数据分析 · 跨部门推进 · GIS · Figma 基础 · Prompt · 敏捷迭代

---
*所有数据已与本人确认，可供面试核验。*`,
    optimizedResumeAts: `求职意向 ${p.targetRole} ${p.targetCompany}
个人总结 8年 城市规划 项目管理 用户研究 需求分析 数据驱动 AI产品 PRD MVP 跨部门
工作经历 钱江新城 片区设计 控规 4部门 批复${f.approvalDaysAfter}天 调研${f.surveyHouseholds}户 深访${f.surveyEnterprises}家 评审${f.reviewRounds}轮
项目 智慧城市 政务数字化 需求${f.smartCityRequirements}条 AI办事 Prompt
技能 用户研究 PRD 数据分析 A/B测试 敏捷 跨部门协调 Figma Prompt 大模型`,
    rewriteSuggestionsFinal: [
      {
        original:
          "负责钱江新城二期片区城市设计及控规编制，协调规划、国土、住建、环保等多部门意见，推动控规批复落地",
        optimized: `牵头钱江新城二期片区城市设计与控规（${f.districtArea}、${f.population}），协调 4 部门需求对齐，批复周期 ${f.approvalDaysBefore}→${f.approvalDaysAfter} 天（${f.approvalImprovement}）`,
        reason: "转译为 0-1 产品规划 + 跨团队推进，数据来自追问确认",
        interviewRisk: "需说清「牵头」与分管领导分工",
      },
      {
        original: "开展人口与产业调研（问卷+深访），支撑规划论证与方案比选",
        optimized: `设计调研方案（${f.surveyHouseholds} 户问卷 + ${f.surveyEnterprises} 家深访），支撑 ${f.chosenPlan} 入选`,
        reason: "对标用户研究与方案决策",
      },
      {
        original:
          "组织 3 轮专家评审会与公众意见征询，建立意见采纳与方案迭代闭环",
        optimized: `${f.reviewRounds} 轮评审、${f.reviewComments} 条意见、采纳率 ${f.reviewAdoptionRate} 后定稿`,
        reason: "体现迭代闭环，与产品评审节奏类似",
      },
    ],
    interviewQuestions: [
      {
        question: `为什么从城市规划转到 ${p.targetCompany} 的 AI 产品？`,
        relatedBullet: "个人总结",
        suggestedAnswerOutline: `动机（平台型+AI）→ 可迁移能力 → 智慧城市 ${f.smartCityRequirements} 条需求 → 已学课程`,
      },
      {
        question: `批复周期缩短 ${f.approvalImprovement} 是否主要由你推动？`,
        relatedBullet: "牵头钱江新城二期",
        suggestedAnswerOutline: "STAR：你的决策点、协调机制、可量化结果、反思",
      },
      {
        question: "智慧城市需求中 5 条 AI 场景具体是什么？",
        relatedBullet: "数字化需求",
        suggestedAnswerOutline: "列举 2–3 条真实场景 + 你在需求池中的角色",
      },
      {
        question: "你写过 PRD 吗？如何做优先级？",
        relatedBullet: "技能区 PRD",
        suggestedAnswerOutline: "用智慧城市需求清单类比 PRD 结构 + 优先级矩阵",
      },
      {
        question: "如何理解 A/B 测试？有无实践？",
        relatedBullet: "技能区",
        suggestedAnswerOutline: "理论框架 + 诚实说明规划项目中的对照比选经验",
      },
    ],
    applicationStrategy: {
      worthApplying: "high",
      reason: `与 ${p.targetCompany} AI 产品岗匹配度提升；建议投递并准备产品方法论补充材料。`,
    },
  };
}

export function buildDemoExtras(): HistoryExtras {
  const p = DEMO_PERSONA;
  const f = DEMO_FACTS;
  return {
    outreach: {
      bossGreeting: `您好，我看到${p.targetCompany} AI 产品经理岗位。我在杭州市规院 8 年，牵头过 ${f.districtArea} 片区跨 4 部门项目（批复周期缩短 ${f.approvalImprovement}），并梳理过 ${f.smartCityRequirements} 条政务数字化需求。已完成 AI 产品系统学习，希望把复杂项目推进经验用在贵司平台型 AI 产品上，方便聊聊吗？`,
      linkedinMessage: `Hi, I'm ${p.name}, transitioning from urban planning to AI PM. I led a ${f.districtArea} district program (${f.approvalImprovement} faster approval) and documented ${f.smartCityRequirements} gov digital requirements (5 AI-related). Completed AI PM coursework. Interested in ${p.targetCompany}'s platform AI products—happy to connect.`,
      emailSubject: `应聘 ${p.targetCompany} AI 产品经理 - ${p.name}（城市规划/数字化需求背景）`,
      emailBody: `您好，\n\n我是${p.name}，现任${p.employer}项目负责人，应聘贵司 AI 产品经理。我主导过江钱新城二期片区（${f.districtArea}），将批复周期从 ${f.approvalDaysBefore} 天缩短至 ${f.approvalDaysAfter} 天；并参与智慧城市专题，梳理 ${f.smartCityRequirements} 条需求。\n\n附件为优化后简历，期待进一步沟通。\n\n${p.name}`,
      tips: [
        `${p.targetCompany} 岗位竞争激烈，打招呼需 1 个量化亮点 + 1 个 AI 相关点`,
        "Boss 避免写「负责」，用「牵头/梳理/推动」",
        "邮件正文控制在 150 字内，简历作附件",
      ],
    },
    english: {
      englishResume: `SUMMARY
${p.name} | Transitioning to AI Product Management
8 years delivering complex urban programs at ${p.employer}. Led Qianjiang New Town Phase II (${f.districtArea}, ${f.population}): cross-functional alignment across 4 departments, approval cycle ${f.approvalDaysBefore}→${f.approvalDaysAfter} days (${f.approvalImprovement}). Smart City initiative: ${f.smartCityRequirements} government requirements (5 AI-related). ${f.aiLearning}.

EXPERIENCE
Project Lead / Urban Planner | 2018–Present
• Led district planning program, stakeholder alignment, measurable cycle-time improvement
• User research: ${f.surveyHouseholds} surveys + ${f.surveyEnterprises} executive interviews → Plan ${f.chosenPlan} selected
• ${f.reviewRounds} review rounds, ${f.reviewComments} comments, ~${f.reviewAdoptionRate} adoption

EDUCATION
M.S. Urban Planning, Tongji University, 2016`,
      linkedinHeadline: `AI Product Manager (Transition) | Complex Programs | ${f.smartCityRequirements} Gov Requirements | User Research`,
      linkedinAbout: `8 years in large-scale planning delivery. Mapping skills to AI PM: research, PRD-thinking via ${f.smartCityRequirements}-item requirement backlog, cross-team execution. Targeting ${p.targetCompany}-style platform AI products.`,
      actionVerbsUsed: ["Led", "Designed", "Aligned", "Delivered", "Documented", "Facilitated"],
    },
    portfolio: {
      portfolioMarkdown: `# ${p.name} · 项目作品集（演示数据，面试前请再核对）

## 项目一：钱江新城二期片区控规（对标 0-1 产品）
- **背景**：${f.districtArea}、${f.population}
- **问题**：4 部门诉求冲突，批复慢（原均 ${f.approvalDaysBefore} 天）
- **行动**：牵头 ${f.teamSize}，建立周例会需求对齐机制
- **结果**：批复 ${f.approvalDaysAfter} 天，缩短 ${f.approvalImprovement}
- **个人贡献**：牵头负责人，对方案与节奏负责

## 项目二：人口产业调研驱动方案决策（对标用户研究）
- **样本**：问卷 ${f.surveyHouseholds} 户 + 深访 ${f.surveyEnterprises} 家
- **结果**：支撑 ${f.chosenPlan} 写入批复

## 项目三：智慧城市政务数字化（对标 B 端需求池）
- **输出**：${f.smartCityRequirements} 条需求，6 模块，5 条 AI 办事场景
- **协作**：${f.smartCityDepartments}
- **个人贡献**：访谈纪要、优先级初评

---
*与简历、追问回答数据一致，仅供 ${p.targetCompany} 类产品岗面试附件。*`,
      projectTitles: [
        "钱江新城二期片区控规",
        "人口产业调研",
        "智慧城市政务数字化",
      ],
    },
  };
}

export interface DemoBundle {
  form: OptimizeResumeRequest;
  followUpAnswers: Record<string, string>;
  diagnose: DiagnoseResponse;
  refine: RefineResponse;
  extras: HistoryExtras;
  historyId: string;
}

export function buildDemoBundle(): DemoBundle {
  return {
    form: DEMO_FORM,
    followUpAnswers: DEMO_FOLLOW_UP_ANSWERS,
    diagnose: buildDemoDiagnose(),
    refine: buildDemoRefine(),
    extras: buildDemoExtras(),
    historyId: DEMO_HISTORY_ID,
  };
}

function truncate(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function buildDemoHistoryRecord(bundle: DemoBundle): HistoryRecord {
  const refine = bundle.refine;
  return {
    id: bundle.historyId,
    createdAt: new Date("2026-05-20T10:00:00.000Z").toISOString(),
    title: deriveTitle(
      bundle.form.targetJobDescription,
      bundle.form.targetRole,
      bundle.form.targetCompany,
    ),
    pinned: true,
    meta: {
      currentRole: bundle.form.currentRole,
      targetRole: bundle.form.targetRole,
      targetCompany: bundle.form.targetCompany,
      targetIndustry: bundle.form.targetIndustry,
    },
    inputs: {
      resumePreview: truncate(bundle.form.originalResumeText),
      jdPreview: truncate(bundle.form.targetJobDescription),
      fullResume: bundle.form.originalResumeText,
      fullJd: bundle.form.targetJobDescription,
    },
    diagnose: bundle.diagnose,
    refine,
    optimizedResume: refine.optimizedResumeHuman,
    matchScore: bundle.diagnose.jdMatch.overall,
    extras: bundle.extras,
  };
}

export function buildDemoVersion(bundle: DemoBundle): ResumeVersion {
  const refine = bundle.refine;
  const meta = {
    targetRole: bundle.form.targetRole,
    targetCompany: bundle.form.targetCompany,
    targetIndustry: bundle.form.targetIndustry,
  };
  return {
    id: DEMO_VERSION_ID,
    historyId: bundle.historyId,
    label: buildVersionLabel(meta),
    targetRole: meta.targetRole,
    targetCompany: meta.targetCompany,
    targetIndustry: meta.targetIndustry,
    matchScore: bundle.diagnose.jdMatch.overall,
    humanResume: refine.optimizedResumeHuman,
    atsResume: refine.optimizedResumeAts,
    summary: refine.optimizedResumeHuman.slice(0, 300),
    keywordsMatched: bundle.diagnose.keywords.matched,
    keywordsMissing: bundle.diagnose.keywords.missing,
    applicationReason: bundle.diagnose.applicationStrategy.reason,
    createdAt: new Date("2026-05-20T11:00:00.000Z").toISOString(),
    isPinned: true,
  };
}

export function buildDemoApplication(bundle: DemoBundle): Application {
  const p = DEMO_PERSONA;
  return {
    id: DEMO_APPLICATION_ID,
    company: p.targetCompany,
    role: p.targetRole,
    status: "wishlist",
    historyId: bundle.historyId,
    versionId: DEMO_VERSION_ID,
    matchScore: bundle.diagnose.jdMatch.overall,
    notes: `演示数据：${bundle.diagnose.applicationStrategy.reason}`,
    createdAt: new Date("2026-05-20T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-20T12:00:00.000Z").toISOString(),
  };
}
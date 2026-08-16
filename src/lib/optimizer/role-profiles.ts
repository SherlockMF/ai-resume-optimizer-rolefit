/**
 * 岗位画像数据层：把「不同岗位的判断标准」做成显式、可扩展的数据，
 * 供诊断 prompt 注入与归一化兜底使用，而不是散落在 prompt 的通用描述里。
 *
 * 每个画像定义：
 * - 诊断维度（带 rubric 与权重）：不同岗位维度不同，替换旧的固定 8 项通用维度
 * - 必备/加分技能词表：让关键词判断更贴近目标岗位
 * - 可迁移能力映射：帮助转行用户把已有经历转译成目标岗位语言
 * - 典型产出物 / 考核指标 / 面试考察点：用于终稿与面试准备
 */

export interface RoleDimension {
  dimension: string;
  weight: number;
  rubric: string;
}

export interface TransferMapping {
  source: string;
  target: string;
}

export interface RoleProfile {
  id: string;
  targetRole: string;
  aliases: string[];
  requiredSkills: string[];
  bonusSkills: string[];
  dimensions: RoleDimension[];
  transferable: TransferMapping[];
  deliverables: string[];
  metrics: string[];
  interviewFocus: string[];
}

/** 未命中任何岗位画像时的通用 fallback 维度 */
export const DEFAULT_DIMENSIONS = [
  "岗位匹配度",
  "成果量化程度",
  "表达专业度",
  "结构清晰度",
  "ATS友好度",
  "可信度",
  "差异化",
  "可读性",
] as const;

/** 各岗位通用的基础维度（权重总和与专属维度配合为 100） */
const DIM_FIT: RoleDimension = {
  dimension: "岗位匹配度",
  weight: 20,
  rubric: "经历与 JD 要求的能力、经验、关键词的匹配程度",
};
const DIM_QUANT: RoleDimension = {
  dimension: "成果量化程度",
  weight: 10,
  rubric: "成果是否有数字、范围或前后对比，便于面试核验",
};
const DIM_ATS: RoleDimension = {
  dimension: "ATS友好度",
  weight: 10,
  rubric: "关键词覆盖、纯文本可解析度、标准栏目标题",
};
const DIM_TRUST: RoleDimension = {
  dimension: "可信度",
  weight: 10,
  rubric: "表述是否真实可核验，有无过度包装风险",
};
const DIM_DIFF: RoleDimension = {
  dimension: "差异化",
  weight: 10,
  rubric: "相对同类候选人的独特卖点与可记忆点",
};

const AI_PM: RoleProfile = {
  id: "ai-pm",
  targetRole: "AI产品经理",
  aliases: ["AI 产品经理", "大模型产品经理", "智能体产品经理", "AIGC产品经理"],
  requiredSkills: ["PRD", "需求分析", "MVP", "A/B测试", "用户研究", "数据分析", "跨部门协作", "产品规划"],
  bonusSkills: ["LLM", "大模型", "AIGC", "智能体", "Prompt工程", "RAG", "Agent"],
  dimensions: [
    DIM_FIT,
    { dimension: "产品方法论", weight: 15, rubric: "PRD、需求分析、MVP 与迭代节奏的专业度" },
    { dimension: "用户研究与数据驱动", weight: 15, rubric: "用户调研、指标定义与数据验证能力" },
    { dimension: "跨团队推进", weight: 10, rubric: "协调算法、研发、设计落地与复盘的能力" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "多部门协调/多方博弈", target: "跨团队推进" },
    { source: "调研/深访/问卷", target: "用户研究" },
    { source: "方案比选/论证", target: "数据驱动决策" },
    { source: "需求清单梳理", target: "需求分析与 PRD" },
    { source: "项目统筹/落地", target: "MVP 落地与迭代" },
  ],
  deliverables: ["PRD", "需求池", "产品路线图", "MVP 验收清单", "A/B 测试方案"],
  metrics: ["转化率", "留存率", "需求交付周期", "功能使用率"],
  interviewFocus: ["需求优先级判断", "数据指标设计", "AI 场景落地案例", "竞品与行业认知"],
};

const PM: RoleProfile = {
  id: "pm",
  targetRole: "产品经理",
  aliases: ["高级产品经理", "平台产品经理", "B端产品经理", "C端产品经理"],
  requiredSkills: ["PRD", "需求分析", "用户研究", "数据分析", "竞品分析", "项目管理", "跨部门协作"],
  bonusSkills: ["数据驱动", "原型设计", "增长实验", "埋点分析", "商业化"],
  dimensions: [
    DIM_FIT,
    { dimension: "需求分析与 PRD", weight: 15, rubric: "需求洞察、优先级判断与文档表达能力" },
    { dimension: "数据驱动决策", weight: 15, rubric: "用指标与实验验证需求与效果的能力" },
    { dimension: "跨团队推进", weight: 10, rubric: "协同研发、设计、运营落地的推动力" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "业务流程梳理", target: "需求分析与 PRD" },
    { source: "跨部门协调", target: "跨团队推进" },
    { source: "数据分析/复盘", target: "数据驱动决策" },
    { source: "用户反馈收集", target: "用户研究" },
  ],
  deliverables: ["PRD", "需求池", "竞品分析", "数据复盘报告"],
  metrics: ["转化率", "留存率", "功能渗透率", "上线周期"],
  interviewFocus: ["需求优先级判断", "数据指标拆解", "跨团队协作案例", "失败项目复盘"],
};

const OPERATIONS: RoleProfile = {
  id: "operations",
  targetRole: "运营",
  aliases: ["用户运营", "内容运营", "增长运营", "新媒体运营", "产品运营", "活动运营"],
  requiredSkills: ["数据分析", "活动策划", "内容运营", "用户增长", "转化率", "留存", "复盘"],
  bonusSkills: ["A/B测试", "私域运营", "社群运营", "SEO", "投放"],
  dimensions: [
    DIM_FIT,
    { dimension: "数据驱动与增长", weight: 15, rubric: "用数据定位问题并驱动增长的意识与结果" },
    { dimension: "内容与用户运营", weight: 15, rubric: "内容产出、用户分层与生命周期运营能力" },
    { dimension: "复盘迭代", weight: 10, rubric: "从活动/内容结果中沉淀方法论并迭代" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "活动组织/执行", target: "活动策划与落地" },
    { source: "调研/问卷", target: "用户洞察" },
    { source: "数据汇总/统计", target: "数据复盘" },
    { source: "内容撰写/宣传", target: "内容运营" },
  ],
  deliverables: ["活动方案", "内容日历", "复盘报告", "用户分层策略"],
  metrics: ["DAU/MAU", "转化率", "留存率", "GMV", "内容曝光"],
  interviewFocus: ["增长案例", "活动 ROI 拆解", "用户分层策略", "内容爆款逻辑"],
};

const DATA_ANALYST: RoleProfile = {
  id: "data-analyst",
  targetRole: "数据分析师",
  aliases: ["数据分析", "商业分析", "BI分析师", "数据产品经理"],
  requiredSkills: ["SQL", "Python", "Excel", "数据可视化", "统计", "指标体系", "业务分析"],
  bonusSkills: ["Tableau", "PowerBI", "A/B测试", "机器学习", "埋点设计"],
  dimensions: [
    DIM_FIT,
    { dimension: "统计与 SQL", weight: 15, rubric: "取数、清洗与统计方法的熟练度" },
    { dimension: "业务分析框架", weight: 15, rubric: "能把业务问题拆解为可验证的分析假设" },
    { dimension: "可视化与表达", weight: 10, rubric: "图表与结论表达能否让业务方快速理解" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "Excel 数据处理", target: "取数与清洗" },
    { source: "调研报告撰写", target: "业务分析报告" },
    { source: "指标统计/汇报", target: "指标体系搭建" },
    { source: "图表制作", target: "数据可视化" },
  ],
  deliverables: ["分析报告", "指标看板", "取数口径文档", "A/B 测试分析"],
  metrics: ["分析准确率", "看板使用率", "需求响应周期"],
  interviewFocus: ["分析项目案例", "指标体系设计", "SQL 与统计基础", "业务敏感度"],
};

const UX_DESIGNER: RoleProfile = {
  id: "ux-designer",
  targetRole: "UX设计师",
  aliases: ["交互设计师", "UI设计师", "用户体验设计师", "设计师"],
  requiredSkills: ["用户研究", "原型设计", "可用性测试", "Figma", "设计规范", "交互设计"],
  bonusSkills: ["设计系统", "A/B测试", "动效", "信息架构"],
  dimensions: [
    DIM_FIT,
    { dimension: "用户研究", weight: 15, rubric: "洞察用户并转化为设计输入的能力" },
    { dimension: "原型与可用性测试", weight: 15, rubric: "快速产出原型并用测试验证设计" },
    { dimension: "设计系统与协作", weight: 10, rubric: "复用设计规范并与研发高效协作" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "用户调研/访谈", target: "用户研究" },
    { source: "方案草图/汇报", target: "原型与交互设计" },
    { source: "视觉规范整理", target: "设计系统" },
    { source: "跨部门对接", target: "设计与研发协作" },
  ],
  deliverables: ["用户研究报告", "线框图/原型", "设计规范", "可用性测试报告"],
  metrics: ["任务完成率", "易用性评分", "设计返工率"],
  interviewFocus: ["作品集叙事", "设计决策依据", "可用性测试方法", "与研发协作案例"],
};

const PROJECT_MANAGER: RoleProfile = {
  id: "project-manager",
  targetRole: "项目经理",
  aliases: ["项目主管", "PMO", "项目专员", "交付经理"],
  requiredSkills: ["项目计划", "风险管理", "进度管理", "干系人沟通", "资源协调", "复盘"],
  bonusSkills: ["敏捷", "Scrum", "PMP", "成本控制", "跨团队交付"],
  dimensions: [
    DIM_FIT,
    { dimension: "范围/进度/风险管理", weight: 15, rubric: "计划、风险识别与进度控制能力" },
    { dimension: "干系人沟通", weight: 15, rubric: "对齐多方诉求与期望管理能力" },
    { dimension: "交付与复盘", weight: 10, rubric: "按期交付并沉淀流程改进" },
    DIM_QUANT,
    DIM_ATS,
    DIM_TRUST,
    DIM_DIFF,
  ],
  transferable: [
    { source: "多部门协调", target: "干系人沟通" },
    { source: "节点/进度把控", target: "进度管理" },
    { source: "风险预案", target: "风险管理" },
    { source: "验收/交付", target: "交付与复盘" },
  ],
  deliverables: ["项目计划", "风险清单", "里程碑报告", "复盘文档"],
  metrics: ["按期交付率", "范围变更率", "风险闭环率"],
  interviewFocus: ["进度失控案例", "风险预案", "干系人冲突处理", "复盘沉淀"],
};

/** 顺序即匹配优先级：更具体的岗位（如 AI 产品经理）应排在通用岗位之前 */
export const ROLE_PROFILES: RoleProfile[] = [
  AI_PM,
  PM,
  OPERATIONS,
  DATA_ANALYST,
  UX_DESIGNER,
  PROJECT_MANAGER,
];

/** 精确命中 targetRole 或别名；否则做子串模糊匹配（更具体的画像已排在前） */
export function resolveRoleProfile(targetRole: string): RoleProfile | null {
  const t = targetRole.trim().toLowerCase();
  if (!t) return null;

  const exact = ROLE_PROFILES.find(
    (p) =>
      p.targetRole.toLowerCase() === t ||
      p.aliases.some((a) => a.toLowerCase() === t),
  );
  if (exact) return exact;

  const fuzzy = ROLE_PROFILES.find(
    (p) =>
      t.includes(p.targetRole.toLowerCase()) ||
      p.aliases.some((a) => t.includes(a.toLowerCase())),
  );
  return fuzzy ?? null;
}

export function getProfileDimensions(profile: RoleProfile | null): string[] {
  return profile ? profile.dimensions.map((d) => d.dimension) : [...DEFAULT_DIMENSIONS];
}

/** 把岗位画像转成注入 prompt 的文本；未命中时回退到通用维度 */
export function formatProfileForPrompt(profile: RoleProfile | null): string {
  if (!profile) {
    return "诊断维度（通用）：" + DEFAULT_DIMENSIONS.join("、") + "。";
  }

  const dims = profile.dimensions
    .map((d) => d.dimension + "（权重 " + d.weight + "，判断标准：" + d.rubric + "）")
    .join("\n");

  return [
    "【" + profile.targetRole + " 岗位画像】",
    "诊断维度（按权重从高到低）：",
    dims,
    "必备技能参考：" + profile.requiredSkills.join("、"),
    "加分技能参考：" + profile.bonusSkills.join("、"),
    "可迁移能力映射（转译已有经历时参考）：",
    profile.transferable
      .map((m) => "- " + m.source + " → " + m.target)
      .join("\n"),
    "典型产出物：" + profile.deliverables.join("、"),
    "考核指标：" + profile.metrics.join("、"),
    "面试考察点：" + profile.interviewFocus.join("、"),
  ].join("\n");
}

import { z } from "zod";

export const onlineResumeThemeIds = [
  "clean",
  "product",
  "creative",
  "tech",
] as const;

export type OnlineResumeThemeId = (typeof onlineResumeThemeIds)[number];

export const onlineResumeThemeIdSchema = z.enum(onlineResumeThemeIds);

export const onlineResumeCtaSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(500),
  style: z.enum(["primary", "secondary"]).default("primary"),
});

export const onlineResumeContentSchema = z.object({
  profile: z.object({
    displayName: z.string().min(1).max(80),
    headline: z.string().min(1).max(160),
    location: z.string().max(120).optional(),
    avatarUrl: z.string().max(2048).optional(),
  }),
  positioning: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(200)).min(2).max(8),
  about: z.string().min(1).max(2000),
  experience: z
    .array(
      z.object({
        company: z.string().min(1).max(120),
        role: z.string().min(1).max(120),
        period: z.string().min(1).max(80),
        bullets: z.array(z.string().min(1).max(300)).min(1).max(6),
      }),
    )
    .max(8),
  projects: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        summary: z.string().min(1).max(800),
        tags: z.array(z.string().max(40)).max(8).optional(),
        link: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(6),
  skills: z.object({
    groups: z
      .array(
        z.object({
          name: z.string().min(1).max(60),
          items: z.array(z.string().min(1).max(60)).min(1).max(16),
        }),
      )
      .min(1)
      .max(6),
  }),
  contact: z.object({
    email: z.string().max(200).optional(),
    phone: z.string().max(40).optional(),
    website: z.string().max(500).optional(),
    linkedin: z.string().max(500).optional(),
    github: z.string().max(500).optional(),
    wechat: z.string().max(80).optional(),
  }),
  ctas: z.array(onlineResumeCtaSchema).min(1).max(4),
  sectionsVisible: z.object({
    about: z.boolean().default(true),
    experience: z.boolean().default(true),
    projects: z.boolean().default(true),
    skills: z.boolean().default(true),
    contact: z.boolean().default(true),
  }),
});

export type OnlineResumeContent = z.infer<typeof onlineResumeContentSchema>;

export const onlineResumeStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
]);

export type OnlineResumeStatus = z.infer<typeof onlineResumeStatusSchema>;

export const onlineResumeSourceTypeSchema = z.enum([
  "pdf",
  "history",
  "version",
  "manual",
]);

export type OnlineResumeSourceType = z.infer<
  typeof onlineResumeSourceTypeSchema
>;

export const generateOnlineResumeRequestSchema = z.object({
  resumeText: z.string().min(50).max(40000),
  targetRole: z.string().max(100).optional(),
  currentRole: z.string().max(100).optional(),
  displayNameHint: z.string().max(80).optional(),
});

export type GenerateOnlineResumeRequest = z.infer<
  typeof generateOnlineResumeRequestSchema
>;

export const generateOnlineResumeResponseSchema = z.object({
  content: onlineResumeContentSchema,
  suggestedTitle: z.string().min(1).max(160),
  suggestedThemeId: onlineResumeThemeIdSchema.optional(),
});

export type GenerateOnlineResumeResponse = z.infer<
  typeof generateOnlineResumeResponseSchema
>;

/** 工作台中的一页（本地或云端） */
export interface OnlineResumePageRecord {
  id: string;
  userId?: string;
  slug: string | null;
  title: string;
  themeId: OnlineResumeThemeId;
  status: OnlineResumeStatus;
  content: OnlineResumeContent;
  sourceType: OnlineResumeSourceType;
  sourceHistoryId?: string | null;
  sourceVersionId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyOnlineResumeContent(
  overrides?: Partial<OnlineResumeContent>,
): OnlineResumeContent {
  const base: OnlineResumeContent = {
    profile: {
      displayName: "姓名",
      headline: "求职定位一句话",
      location: "",
    },
    positioning: "用一句话说明你能为目标岗位带来什么。",
    highlights: ["核心优势 1", "核心优势 2", "核心优势 3"],
    about: "简短自我介绍，突出转行/匹配叙事。",
    experience: [
      {
        company: "公司 / 组织",
        role: "职位",
        period: "2020 – 至今",
        bullets: ["用结果导向的一句话描述贡献。"],
      },
    ],
    projects: [
      {
        name: "代表项目",
        summary: "项目背景、你的角色与可验证成果。",
        tags: ["关键词"],
      },
    ],
    skills: {
      groups: [{ name: "核心技能", items: ["技能 A", "技能 B"] }],
    },
    contact: {},
    ctas: [{ label: "约个聊聊", href: "#contact", style: "primary" }],
    sectionsVisible: {
      about: true,
      experience: true,
      projects: true,
      skills: true,
      contact: true,
    },
  };
  return { ...base, ...overrides, profile: { ...base.profile, ...overrides?.profile } };
}

import type { OnlineResumeThemeId } from "@/lib/types/online-resume";

export type OnlineResumeLayoutVariant =
  | "classic"
  | "hero-split"
  | "magazine"
  | "console";

export type OnlineResumeThemeDef = {
  id: OnlineResumeThemeId;
  name: string;
  description: string;
  layoutVariant: OnlineResumeLayoutVariant;
  /** Inline CSS variables applied on the root */
  vars: Record<string, string>;
};

export const ONLINE_RESUME_THEMES: OnlineResumeThemeDef[] = [
  {
    id: "clean",
    name: "清爽专业",
    description: "留白、细线、衬线标题，适合正式求职",
    layoutVariant: "classic",
    vars: {
      "--or-bg": "#f7f5f1",
      "--or-fg": "#1a1a1a",
      "--or-muted": "#5c5c5c",
      "--or-accent": "#0f3d2e",
      "--or-accent-fg": "#f7f5f1",
      "--or-card": "#ffffff",
      "--or-border": "rgba(26,26,26,0.12)",
      "--or-font-display": '"Source Serif 4", "Noto Serif SC", Georgia, serif',
      "--or-font-body": '"DM Sans", "Noto Sans SC", system-ui, sans-serif',
      "--or-radius": "0.5rem",
      "--or-hero-pad": "4.5rem",
    },
  },
  {
    id: "product",
    name: "产品主页风",
    description: "大标题、强 CTA，像产品落地页",
    layoutVariant: "hero-split",
    vars: {
      "--or-bg": "#f4f7fb",
      "--or-fg": "#0b1220",
      "--or-muted": "#4a5568",
      "--or-accent": "#2563eb",
      "--or-accent-fg": "#ffffff",
      "--or-card": "#ffffff",
      "--or-border": "rgba(37,99,235,0.15)",
      "--or-font-display": '"Sora", "Noto Sans SC", system-ui, sans-serif',
      "--or-font-body": '"Sora", "Noto Sans SC", system-ui, sans-serif',
      "--or-radius": "1rem",
      "--or-hero-pad": "5rem",
    },
  },
  {
    id: "creative",
    name: "创意作品集风",
    description: "非对称、大项目名、色块氛围",
    layoutVariant: "magazine",
    vars: {
      "--or-bg": "#fff8f0",
      "--or-fg": "#1c1410",
      "--or-muted": "#6b5344",
      "--or-accent": "#e85d04",
      "--or-accent-fg": "#fff8f0",
      "--or-card": "#ffe8d1",
      "--or-border": "rgba(232,93,4,0.25)",
      "--or-font-display": '"Fraunces", "Noto Serif SC", Georgia, serif',
      "--or-font-body": '"Outfit", "Noto Sans SC", system-ui, sans-serif',
      "--or-radius": "1.25rem",
      "--or-hero-pad": "4rem",
    },
  },
  {
    id: "tech",
    name: "企业科技风",
    description: "深色高对比、网格与等宽点缀",
    layoutVariant: "console",
    vars: {
      "--or-bg": "#0b1020",
      "--or-fg": "#e8eefc",
      "--or-muted": "#9aa8c7",
      "--or-accent": "#22d3ee",
      "--or-accent-fg": "#0b1020",
      "--or-card": "#121a2f",
      "--or-border": "rgba(34,211,238,0.22)",
      "--or-font-display": '"IBM Plex Sans", "Noto Sans SC", system-ui, sans-serif',
      "--or-font-body": '"IBM Plex Sans", "Noto Sans SC", system-ui, sans-serif',
      "--or-radius": "0.35rem",
      "--or-hero-pad": "4.5rem",
    },
  },
];

export function getTheme(id: OnlineResumeThemeId): OnlineResumeThemeDef {
  return (
    ONLINE_RESUME_THEMES.find((t) => t.id === id) ?? ONLINE_RESUME_THEMES[0]
  );
}

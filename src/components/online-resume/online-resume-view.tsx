"use client";

import type { CSSProperties } from "react";
import type { OnlineResumeContent, OnlineResumeThemeId } from "@/lib/types/online-resume";
import { getTheme } from "@/lib/online-resume/themes";
import { cn } from "@/lib/utils";

type OnlineResumeViewProps = {
  content: OnlineResumeContent;
  themeId: OnlineResumeThemeId;
  className?: string;
  /** 公开页显示 RoleFit 页脚 */
  showBrandFooter?: boolean;
};

function CtaButtons({
  ctas,
}: {
  ctas: OnlineResumeContent["ctas"];
}) {
  return (
    <div className="or-ctas flex flex-wrap gap-3">
      {ctas.map((cta, i) => (
        <a
          key={`${cta.label}-${i}`}
          href={cta.href}
          className={cn(
            "inline-flex items-center justify-center rounded-[var(--or-radius)] px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5",
            cta.style === "primary"
              ? "bg-[var(--or-accent)] text-[var(--or-accent-fg)]"
              : "border border-[var(--or-border)] bg-transparent text-[var(--or-fg)]",
          )}
        >
          {cta.label}
        </a>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--or-muted)]"
      style={{ fontFamily: "var(--or-font-body)" }}
    >
      {children}
    </h2>
  );
}

export function OnlineResumeView({
  content,
  themeId,
  className,
  showBrandFooter = false,
}: OnlineResumeViewProps) {
  const theme = getTheme(themeId);
  const style = theme.vars as CSSProperties;
  const vis = content.sectionsVisible;
  const layout = theme.layoutVariant;

  return (
    <div
      data-theme={themeId}
      data-layout={layout}
      className={cn(
        "or-root min-h-full text-[var(--or-fg)] antialiased",
        className,
      )}
      style={{
        ...style,
        background: "var(--or-bg)",
        fontFamily: "var(--or-font-body)",
        color: "var(--or-fg)",
      }}
    >
      <div
        className={cn(
          "mx-auto w-full",
          layout === "magazine" ? "max-w-5xl" : "max-w-4xl",
          "px-5 sm:px-8",
        )}
        style={{ paddingTop: "var(--or-hero-pad)", paddingBottom: "4rem" }}
      >
        {/* Hero */}
        <header
          className={cn(
            "or-hero mb-12",
            layout === "hero-split" && "grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end",
            layout === "console" &&
              "rounded-[var(--or-radius)] border border-[var(--or-border)] bg-[var(--or-card)] p-6 sm:p-8",
            layout === "magazine" && "relative",
          )}
        >
          {layout === "magazine" && (
            <div
              aria-hidden
              className="pointer-events-none absolute -left-4 top-0 h-24 w-24 rounded-full opacity-40"
              style={{ background: "var(--or-accent)" }}
            />
          )}
          <div>
            <p className="mb-2 text-xs tracking-[0.2em] text-[var(--or-muted)] uppercase">
              {content.profile.location || "求职主页"}
            </p>
            <h1
              className={cn(
                "text-4xl font-semibold tracking-tight sm:text-5xl",
                layout === "magazine" && "text-5xl sm:text-6xl",
              )}
              style={{ fontFamily: "var(--or-font-display)" }}
            >
              {content.profile.displayName}
            </h1>
            <p
              className={cn(
                "mt-3 text-lg text-[var(--or-muted)]",
                layout === "hero-split" && "text-xl text-[var(--or-fg)]",
              )}
            >
              {content.profile.headline}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed">
              {content.positioning}
            </p>
            <div className="mt-6">
              <CtaButtons ctas={content.ctas} />
            </div>
          </div>
          {layout === "hero-split" && (
            <ul className="space-y-3 rounded-[var(--or-radius)] border border-[var(--or-border)] bg-[var(--or-card)] p-5">
              {content.highlights.slice(0, 4).map((h) => (
                <li key={h} className="text-sm leading-relaxed">
                  <span className="mr-2 text-[var(--or-accent)]">▸</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </header>

        {layout !== "hero-split" && content.highlights.length > 0 && (
          <section className="mb-12">
            <SectionTitle>核心优势</SectionTitle>
            <ul
              className={cn(
                "grid gap-3",
                layout === "magazine" ? "sm:grid-cols-2" : "sm:grid-cols-3",
              )}
            >
              {content.highlights.map((h, i) => (
                <li
                  key={h}
                  className="rounded-[var(--or-radius)] border border-[var(--or-border)] bg-[var(--or-card)] p-4 text-sm leading-relaxed"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {vis.about && (
          <section className="mb-12">
            <SectionTitle>关于我</SectionTitle>
            <p className="max-w-3xl text-base leading-relaxed text-[var(--or-muted)]">
              {content.about}
            </p>
          </section>
        )}

        {vis.projects && content.projects.length > 0 && (
          <section className="mb-12">
            <SectionTitle>项目经历</SectionTitle>
            <div
              className={cn(
                "grid gap-4",
                layout === "magazine" ? "md:grid-cols-2" : "grid-cols-1",
              )}
            >
              {content.projects.map((p, i) => (
                <article
                  key={`${p.name}-${i}`}
                  className={cn(
                    "rounded-[var(--or-radius)] border border-[var(--or-border)] bg-[var(--or-card)] p-5 transition-transform hover:-translate-y-0.5",
                    layout === "console" && "font-mono text-[0.95rem]",
                  )}
                >
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      layout === "magazine" && "text-2xl",
                    )}
                    style={{ fontFamily: "var(--or-font-display)" }}
                  >
                    {p.link ? (
                      <a href={p.link} className="hover:text-[var(--or-accent)]">
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--or-muted)]">
                    {p.summary}
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--or-border)] px-2.5 py-0.5 text-xs text-[var(--or-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {vis.experience && content.experience.length > 0 && (
          <section className="mb-12">
            <SectionTitle>工作经历</SectionTitle>
            <div className="space-y-6">
              {content.experience.map((exp, i) => (
                <div
                  key={`${exp.company}-${i}`}
                  className="border-b border-[var(--or-border)] pb-6 last:border-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ fontFamily: "var(--or-font-display)" }}
                    >
                      {exp.role} · {exp.company}
                    </h3>
                    <span className="text-xs text-[var(--or-muted)]">
                      {exp.period}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {exp.bullets.map((b) => (
                      <li
                        key={b}
                        className="text-sm leading-relaxed text-[var(--or-muted)]"
                      >
                        · {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {vis.skills && content.skills.groups.length > 0 && (
          <section className="mb-12">
            <SectionTitle>技能</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.skills.groups.map((g) => (
                <div key={g.name}>
                  <h3 className="mb-2 text-sm font-medium">{g.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((item) => (
                      <span
                        key={item}
                        className={cn(
                          "border border-[var(--or-border)] px-2.5 py-1 text-xs",
                          layout === "console"
                            ? "rounded-sm font-mono text-[var(--or-accent)]"
                            : "rounded-full text-[var(--or-muted)]",
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {vis.contact && (
          <section id="contact" className="mb-8 scroll-mt-20">
            <SectionTitle>联系方式</SectionTitle>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--or-muted)]">
              {content.contact.email && (
                <a
                  href={`mailto:${content.contact.email}`}
                  className="hover:text-[var(--or-accent)]"
                >
                  {content.contact.email}
                </a>
              )}
              {content.contact.phone && <span>{content.contact.phone}</span>}
              {content.contact.website && (
                <a
                  href={content.contact.website}
                  className="hover:text-[var(--or-accent)]"
                >
                  Website
                </a>
              )}
              {content.contact.linkedin && (
                <a
                  href={content.contact.linkedin}
                  className="hover:text-[var(--or-accent)]"
                >
                  LinkedIn
                </a>
              )}
              {content.contact.github && (
                <a
                  href={content.contact.github}
                  className="hover:text-[var(--or-accent)]"
                >
                  GitHub
                </a>
              )}
              {content.contact.wechat && (
                <span>微信：{content.contact.wechat}</span>
              )}
            </div>
            <div className="mt-6">
              <CtaButtons ctas={content.ctas} />
            </div>
          </section>
        )}

        {showBrandFooter && (
          <footer className="mt-16 border-t border-[var(--or-border)] pt-6 text-center text-xs text-[var(--or-muted)]">
            由{" "}
            <a href="/" className="underline underline-offset-2">
              RoleFit
            </a>{" "}
            生成求职主页
          </footer>
        )}
      </div>
    </div>
  );
}

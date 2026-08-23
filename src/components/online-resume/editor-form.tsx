"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { OnlineResumeContent } from "@/lib/types/online-resume";

type EditorFormProps = {
  content: OnlineResumeContent;
  onChange: (next: OnlineResumeContent) => void;
};

function updateAt<T>(arr: T[], index: number, value: T): T[] {
  return arr.map((item, i) => (i === index ? value : item));
}

export function OnlineResumeEditorForm({ content, onChange }: EditorFormProps) {
  const set = (patch: Partial<OnlineResumeContent>) =>
    onChange({ ...content, ...patch });

  return (
    <div className="space-y-8 text-sm">
      <section className="space-y-3">
        <h3 className="font-medium">个人资料</h3>
        <div className="grid gap-2">
          <Label>姓名</Label>
          <Input
            value={content.profile.displayName}
            onChange={(e) =>
              set({
                profile: { ...content.profile, displayName: e.target.value },
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Headline</Label>
          <Input
            value={content.profile.headline}
            onChange={(e) =>
              set({
                profile: { ...content.profile, headline: e.target.value },
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>地点</Label>
          <Input
            value={content.profile.location ?? ""}
            onChange={(e) =>
              set({
                profile: { ...content.profile, location: e.target.value },
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>定位句</Label>
          <Textarea
            rows={3}
            value={content.positioning}
            onChange={(e) => set({ positioning: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">核心优势</h3>
        {content.highlights.map((h, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={h}
              onChange={(e) =>
                set({
                  highlights: updateAt(content.highlights, i, e.target.value),
                })
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  highlights: content.highlights.filter((_, idx) => idx !== i),
                })
              }
            >
              删
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set({ highlights: [...content.highlights, "新优势"] })}
        >
          添加优势
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={content.sectionsVisible.about}
            onCheckedChange={(c) =>
              set({
                sectionsVisible: {
                  ...content.sectionsVisible,
                  about: c === true,
                },
              })
            }
          />
          <h3 className="font-medium">关于我</h3>
        </div>
        <Textarea
          rows={4}
          value={content.about}
          onChange={(e) => set({ about: e.target.value })}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={content.sectionsVisible.projects}
            onCheckedChange={(c) =>
              set({
                sectionsVisible: {
                  ...content.sectionsVisible,
                  projects: c === true,
                },
              })
            }
          />
          <h3 className="font-medium">项目</h3>
        </div>
        {content.projects.map((p, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <Input
              placeholder="项目名"
              value={p.name}
              onChange={(e) =>
                set({
                  projects: updateAt(content.projects, i, {
                    ...p,
                    name: e.target.value,
                  }),
                })
              }
            />
            <Textarea
              rows={3}
              placeholder="摘要"
              value={p.summary}
              onChange={(e) =>
                set({
                  projects: updateAt(content.projects, i, {
                    ...p,
                    summary: e.target.value,
                  }),
                })
              }
            />
            <Input
              placeholder="标签，逗号分隔"
              value={(p.tags ?? []).join(", ")}
              onChange={(e) =>
                set({
                  projects: updateAt(content.projects, i, {
                    ...p,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }),
                })
              }
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={i === 0}
                onClick={() => {
                  const next = [...content.projects];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set({ projects: next });
                }}
              >
                上移
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={i === content.projects.length - 1}
                onClick={() => {
                  const next = [...content.projects];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  set({ projects: next });
                }}
              >
                下移
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  set({
                    projects: content.projects.filter((_, idx) => idx !== i),
                  })
                }
              >
                删除
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            set({
              projects: [
                ...content.projects,
                { name: "新项目", summary: "项目说明", tags: [] },
              ],
            })
          }
        >
          添加项目
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={content.sectionsVisible.experience}
            onCheckedChange={(c) =>
              set({
                sectionsVisible: {
                  ...content.sectionsVisible,
                  experience: c === true,
                },
              })
            }
          />
          <h3 className="font-medium">工作经历</h3>
        </div>
        {content.experience.map((exp, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="公司"
                value={exp.company}
                onChange={(e) =>
                  set({
                    experience: updateAt(content.experience, i, {
                      ...exp,
                      company: e.target.value,
                    }),
                  })
                }
              />
              <Input
                placeholder="职位"
                value={exp.role}
                onChange={(e) =>
                  set({
                    experience: updateAt(content.experience, i, {
                      ...exp,
                      role: e.target.value,
                    }),
                  })
                }
              />
            </div>
            <Input
              placeholder="时间"
              value={exp.period}
              onChange={(e) =>
                set({
                  experience: updateAt(content.experience, i, {
                    ...exp,
                    period: e.target.value,
                  }),
                })
              }
            />
            <Textarea
              rows={3}
              placeholder="要点，每行一条"
              value={exp.bullets.join("\n")}
              onChange={(e) =>
                set({
                  experience: updateAt(content.experience, i, {
                    ...exp,
                    bullets: e.target.value
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean),
                  }),
                })
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  experience: content.experience.filter((_, idx) => idx !== i),
                })
              }
            >
              删除经历
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            set({
              experience: [
                ...content.experience,
                {
                  company: "公司",
                  role: "职位",
                  period: "2024 – 至今",
                  bullets: ["成果描述"],
                },
              ],
            })
          }
        >
          添加经历
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={content.sectionsVisible.skills}
            onCheckedChange={(c) =>
              set({
                sectionsVisible: {
                  ...content.sectionsVisible,
                  skills: c === true,
                },
              })
            }
          />
          <h3 className="font-medium">技能</h3>
        </div>
        {content.skills.groups.map((g, i) => (
          <div key={i} className="space-y-2">
            <Input
              value={g.name}
              onChange={(e) =>
                set({
                  skills: {
                    groups: updateAt(content.skills.groups, i, {
                      ...g,
                      name: e.target.value,
                    }),
                  },
                })
              }
            />
            <Input
              placeholder="技能，逗号分隔"
              value={g.items.join(", ")}
              onChange={(e) =>
                set({
                  skills: {
                    groups: updateAt(content.skills.groups, i, {
                      ...g,
                      items: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }),
                  },
                })
              }
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={content.sectionsVisible.contact}
            onCheckedChange={(c) =>
              set({
                sectionsVisible: {
                  ...content.sectionsVisible,
                  contact: c === true,
                },
              })
            }
          />
          <h3 className="font-medium">联系与 CTA</h3>
        </div>
        <Input
          placeholder="邮箱"
          value={content.contact.email ?? ""}
          onChange={(e) =>
            set({ contact: { ...content.contact, email: e.target.value } })
          }
        />
        <Input
          placeholder="主 CTA 文案"
          value={content.ctas[0]?.label ?? ""}
          onChange={(e) =>
            set({
              ctas: [
                {
                  label: e.target.value,
                  href: content.ctas[0]?.href ?? "#contact",
                  style: content.ctas[0]?.style ?? "primary",
                },
                ...content.ctas.slice(1),
              ],
            })
          }
        />
        <Input
          placeholder="主 CTA 链接"
          value={content.ctas[0]?.href ?? ""}
          onChange={(e) =>
            set({
              ctas: [
                {
                  label: content.ctas[0]?.label ?? "联系我",
                  href: e.target.value,
                  style: content.ctas[0]?.style ?? "primary",
                },
                ...content.ctas.slice(1),
              ],
            })
          }
        />
      </section>
    </div>
  );
}

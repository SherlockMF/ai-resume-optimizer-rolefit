"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { useCloudData } from "@/components/layout/cloud-data-provider";
import { OnlineResumeEditorForm } from "@/components/online-resume/editor-form";
import { OnlineResumeView } from "@/components/online-resume/online-resume-view";
import { ThemePicker } from "@/components/online-resume/theme-picker";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openAuthDialog } from "@/lib/auth/auth-dialog";
import {
  getCloudOnlineResume,
  isSlugTaken,
  upsertCloudOnlineResume,
} from "@/lib/online-resume/cloud";
import {
  getLocalOnlineResume,
  isLocalOnlineResumeId,
  removeLocalOnlineResume,
  upsertLocalOnlineResume,
} from "@/lib/online-resume/local-storage";
import {
  isValidSlug,
  publicPageUrl,
  suggestSlug,
} from "@/lib/online-resume/slug";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  OnlineResumeContent,
  OnlineResumePageRecord,
  OnlineResumeThemeId,
} from "@/lib/types/online-resume";

export default function EditOnlineResumePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, status: cloudStatus } = useCloudData();

  const [record, setRecord] = useState<OnlineResumePageRecord | null>(null);
  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState<OnlineResumeThemeId>("clean");
  const [content, setContent] = useState<OnlineResumeContent | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordRef = useRef<OnlineResumePageRecord | null>(null);

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  const load = useCallback(async () => {
    setError(null);
    if (isLocalOnlineResumeId(id)) {
      const local = getLocalOnlineResume(id);
      if (!local) {
        setError("本地草稿不存在");
        return;
      }
      setRecord(local);
      setTitle(local.title);
      setThemeId(local.themeId);
      setContent(local.content);
      setSlugInput(local.slug ?? suggestSlug(local.content.profile.displayName));
      return;
    }
    if (!user) {
      setError("请先登录以编辑云端主页");
      return;
    }
    const client = getBrowserSupabaseClient();
    if (!client) {
      setError("未配置 Supabase");
      return;
    }
    const cloud = await getCloudOnlineResume(client, id);
    if (!cloud) {
      setError("云端主页不存在");
      return;
    }
    setRecord(cloud);
    setTitle(cloud.title);
    setThemeId(cloud.themeId);
    setContent(cloud.content);
    setSlugInput(cloud.slug ?? suggestSlug(cloud.content.profile.displayName));
  }, [id, user]);

  useEffect(() => {
    if (cloudStatus === "loading") return;
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "加载失败"),
    );
  }, [cloudStatus, load]);

  const persistDraft = useCallback(
    async (next: {
      title: string;
      themeId: OnlineResumeThemeId;
      content: OnlineResumeContent;
    }) => {
      const base = recordRef.current;
      if (!base) return;
      setSaving(true);
      setError(null);
      try {
        if (user && !isLocalOnlineResumeId(base.id)) {
          const client = getBrowserSupabaseClient();
          if (!client) throw new Error("未配置 Supabase");
          const saved = await upsertCloudOnlineResume(client, user.id, {
            id: base.id,
            slug: base.slug,
            title: next.title,
            themeId: next.themeId,
            status: base.status === "published" ? "published" : "draft",
            content: next.content,
            sourceType: base.sourceType,
            sourceHistoryId: base.sourceHistoryId,
            sourceVersionId: base.sourceVersionId,
            publishedAt: base.publishedAt,
          });
          setRecord(saved);
        } else if (user && isLocalOnlineResumeId(base.id)) {
          // 登录后把本地草稿升到云端：由「保存到云端」按钮处理
          const saved = upsertLocalOnlineResume({
            ...base,
            title: next.title,
            themeId: next.themeId,
            content: next.content,
          });
          setRecord(saved);
        } else {
          const saved = upsertLocalOnlineResume({
            ...base,
            title: next.title,
            themeId: next.themeId,
            content: next.content,
          });
          setRecord(saved);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "自动保存失败");
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const scheduleSave = useCallback(
    (next: {
      title: string;
      themeId: OnlineResumeThemeId;
      content: OnlineResumeContent;
    }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistDraft(next);
      }, 800);
    },
    [persistDraft],
  );

  const onContentChange = (nextContent: OnlineResumeContent) => {
    setContent(nextContent);
    scheduleSave({ title, themeId, content: nextContent });
  };

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (content) scheduleSave({ title: value, themeId, content });
  };

  const onThemeChange = (value: OnlineResumeThemeId) => {
    setThemeId(value);
    if (content) scheduleSave({ title, themeId: value, content });
  };

  const uploadLocalToCloud = async () => {
    if (!content || !record) return;
    const run = async () => {
      const client = getBrowserSupabaseClient();
      const {
        data: { user: u },
      } = (await client?.auth.getUser()) ?? { data: { user: null } };
      if (!client || !u) {
        openAuthDialog({ onSuccess: () => void uploadLocalToCloud() });
        return;
      }
      try {
        const saved = await upsertCloudOnlineResume(client, u.id, {
          title,
          themeId,
          status: "draft",
          content,
          sourceType: record.sourceType,
          sourceHistoryId: record.sourceHistoryId,
          sourceVersionId: record.sourceVersionId,
        });
        if (isLocalOnlineResumeId(record.id)) {
          removeLocalOnlineResume(record.id);
        }
        setMessage("已保存到云端");
        router.replace(`/online-resume/${saved.id}/edit`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "上传失败");
      }
    };
    await run();
  };

  const doPublish = async () => {
    if (!content || !record) return;
    setPublishing(true);
    setError(null);
    try {
      const client = getBrowserSupabaseClient();
      const {
        data: { user: u },
      } = (await client?.auth.getUser()) ?? { data: { user: null } };
      if (!client || !u) {
        openAuthDialog({ onSuccess: () => void doPublish() });
        setPublishing(false);
        return;
      }

      const slug = slugInput.trim().toLowerCase();
      if (!isValidSlug(slug)) {
        throw new Error("Slug 格式无效（3–48 位小写字母数字与连字符）");
      }
      const cloudId = isLocalOnlineResumeId(record.id) ? undefined : record.id;
      if (await isSlugTaken(client, slug, cloudId)) {
        throw new Error("该链接已被占用，请换一个 slug");
      }

      const publishedAt = new Date().toISOString();
      const saved = await upsertCloudOnlineResume(client, u.id, {
        id: cloudId,
        slug,
        title,
        themeId,
        status: "published",
        content,
        sourceType: record.sourceType,
        sourceHistoryId: record.sourceHistoryId,
        sourceVersionId: record.sourceVersionId,
        publishedAt,
      });

      if (isLocalOnlineResumeId(record.id)) {
        removeLocalOnlineResume(record.id);
      }

      setRecord(saved);
      setMessage(`已发布：${publicPageUrl(slug)}`);
      if (saved.id !== id) {
        router.replace(`/online-resume/${saved.id}/edit`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm text-muted-foreground">
            {error ?? "加载中…"}
          </p>
          {error && (
            <ButtonLink href="/online-resume" className="mt-4" variant="outline">
              返回列表
            </ButtonLink>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Label>主页标题</Label>
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {saving ? "保存中…" : "已自动保存"}
            </span>
            {isLocalOnlineResumeId(id) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void uploadLocalToCloud()}
              >
                保存到云端
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={publishing}
              onClick={() => void doPublish()}
            >
              {publishing ? "发布中…" : "发布"}
            </Button>
            <ButtonLink href="/online-resume" variant="outline" size="sm">
              列表
            </ButtonLink>
          </div>
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>公开链接 slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/p/</span>
              <Input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
              />
            </div>
          </div>
          {record?.status === "published" && record.slug && (
            <ButtonLink
              href={`/p/${record.slug}`}
              variant="outline"
              size="sm"
              target="_blank"
            >
              查看公开页
            </ButtonLink>
          )}
        </div>

        {message && (
          <p className="mb-3 text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <div className="mb-4">
          <Label className="mb-2 block">主题</Label>
          <ThemePicker value={themeId} onChange={onThemeChange} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-background p-4">
            <OnlineResumeEditorForm
              content={content}
              onChange={onContentChange}
            />
          </div>
          <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-border">
            <OnlineResumeView content={content} themeId={themeId} />
          </div>
        </div>
      </main>
    </div>
  );
}

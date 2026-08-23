"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { useCloudData } from "@/components/layout/cloud-data-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openAuthDialog } from "@/lib/auth/auth-dialog";
import {
  deleteCloudOnlineResume,
  listCloudOnlineResumes,
  upsertCloudOnlineResume,
} from "@/lib/online-resume/cloud";
import {
  listLocalOnlineResumes,
  removeLocalOnlineResume,
} from "@/lib/online-resume/local-storage";
import { publicPageUrl } from "@/lib/online-resume/slug";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { OnlineResumePageRecord } from "@/lib/types/online-resume";

export default function OnlineResumeListPage() {
  const { user, status: cloudStatus } = useCloudData();
  const [items, setItems] = useState<OnlineResumePageRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const client = getBrowserSupabaseClient();
        if (!client) throw new Error("未配置 Supabase");
        const cloud = await listCloudOnlineResumes(client);
        setItems(cloud);
      } else {
        setItems(listLocalOnlineResumes());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (cloudStatus === "loading") return;
    void refresh();
  }, [cloudStatus, refresh]);

  const handleCopy = async (slug: string) => {
    const url = publicPageUrl(slug);
    await navigator.clipboard.writeText(url);
    setMessage(`已复制：${url}`);
  };

  const handleUnpublish = async (item: OnlineResumePageRecord) => {
    if (!user) return;
    const client = getBrowserSupabaseClient();
    if (!client) return;
    try {
      await upsertCloudOnlineResume(client, user.id, {
        id: item.id,
        slug: item.slug,
        title: item.title,
        themeId: item.themeId,
        status: "draft",
        content: item.content,
        sourceType: item.sourceType,
        sourceHistoryId: item.sourceHistoryId,
        sourceVersionId: item.sourceVersionId,
        publishedAt: null,
      });
      setMessage("已取消发布");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleDelete = async (item: OnlineResumePageRecord) => {
    if (!confirm(`确定删除「${item.title}」？`)) return;
    try {
      if (user && !item.id.startsWith("local-")) {
        const client = getBrowserSupabaseClient();
        if (!client) throw new Error("未配置 Supabase");
        await deleteCloudOnlineResume(client, item.id);
      } else {
        removeLocalOnlineResume(item.id);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              RoleFit 2.0
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              在线简历主页
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              从 PDF 或诊断历史生成可编辑、可换主题的求职主页，发布后公开分享。
              {!user && " 未登录时草稿保存在本机；发布需登录。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!user && (
              <Button
                type="button"
                variant="outline"
                onClick={() => openAuthDialog({ onSuccess: () => void refresh() })}
              >
                登录以同步云端
              </Button>
            )}
            <ButtonLink href="/online-resume/new">
              <FilePlus2 className="size-4" />
              新建主页
            </ButtonLink>
          </div>
        </div>

        {message && (
          <p className="mb-4 text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardHeader>
              <CardTitle className="text-base">还没有主页</CardTitle>
              <CardDescription>
                上传简历或从优化历史生成第一份在线求职主页。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/online-resume/new">开始创建</ButtonLink>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.status === "published" ? "已发布" : "草稿"} · 主题{" "}
                    {item.themeId}
                    {item.slug ? ` · /p/${item.slug}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    href={`/online-resume/${item.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="size-3.5" />
                    编辑
                  </ButtonLink>
                  {item.status === "published" && item.slug && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopy(item.slug!)}
                      >
                        <Copy className="size-3.5" />
                        复制链接
                      </Button>
                      <ButtonLink
                        href={`/p/${item.slug}`}
                        variant="outline"
                        size="sm"
                        target="_blank"
                      >
                        <ExternalLink className="size-3.5" />
                        打开
                      </ButtonLink>
                      {user && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleUnpublish(item)}
                        >
                          取消发布
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDelete(item)}
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          也可从{" "}
          <Link href="/optimizer" className="underline underline-offset-2">
            优化工作台
          </Link>{" "}
          终稿后一键生成主页。
        </p>
      </main>
    </div>
  );
}

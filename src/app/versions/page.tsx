"use client";

import { useEffect, useState } from "react";
import { GitCompare, Pin, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VersionCompareDialog } from "@/components/versions/version-compare-dialog";
import {
  listVersions,
  removeVersion,
  syncVersionsFromHistory,
  toggleVersionPin,
  type ResumeVersion,
} from "@/lib/storage/versions";
import { subscribeCloudDataChanged } from "@/lib/supabase/cloud-events";
import { useCloudData } from "@/components/layout/cloud-data-provider";

export default function VersionsPage() {
  const { status } = useCloudData();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const refresh = () => setVersions(listVersions());

  useEffect(() => {
    // 登录 hydrate 完成前不要从历史补版本，避免把旧本地数据写回云端
    if (status === "loading") return;
    syncVersionsFromHistory();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVersions(listVersions());
  }, [status]);

  useEffect(() => subscribeCloudDataChanged(refresh), []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length === 2) setCompareOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              v0.4 · 岗位版本
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">多岗位版本管理</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              每次生成终稿会自动保存一个版本，勾选 2 个可并排对比
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={selected.length !== 2}
              onClick={handleCompare}
            >
              <GitCompare className="size-4" />
              对比选中 2 个
            </Button>
            <ButtonLink href="/optimizer">去优化简历</ButtonLink>
          </div>
        </div>

        {versions.length === 0 ? (
          <Card className="border-border/80 shadow-none">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              暂无版本。在优化器完成终稿后会自动出现在这里。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {versions.map((v) => (
              <Card key={v.id} className="border-border/80 shadow-none">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <Checkbox
                    checked={selected.includes(v.id)}
                    onCheckedChange={() => toggleSelect(v.id)}
                    aria-label={`选择 ${v.label}`}
                  />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{v.label}</CardTitle>
                    <CardDescription>
                      {new Date(v.createdAt).toLocaleString("zh-CN")}
                      {v.matchScore != null && ` · 匹配 ${v.matchScore}`}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-4 text-xs text-muted-foreground whitespace-pre-wrap">
                    {v.summary}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toggleVersionPin(v.id);
                        refresh();
                      }}
                    >
                      <Pin className="size-3.5" />
                      {v.isPinned ? "取消置顶" : "置顶"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        removeVersion(v.id);
                        setSelected((s) => s.filter((x) => x !== v.id));
                        refresh();
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <VersionCompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          versionIdA={selected[0] ?? null}
          versionIdB={selected[1] ?? null}
        />
      </main>
    </div>
  );
}

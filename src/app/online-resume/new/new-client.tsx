"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseResumeFile } from "@/lib/file-parsers";
import {
  createLocalOnlineResumeId,
  upsertLocalOnlineResume,
} from "@/lib/online-resume/local-storage";
import { upsertCloudOnlineResume } from "@/lib/online-resume/cloud";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { useCloudData } from "@/components/layout/cloud-data-provider";
import { listAll as listHistory } from "@/lib/storage/history";
import { listVersions } from "@/lib/storage/versions";
import type {
  GenerateOnlineResumeResponse,
  OnlineResumeSourceType,
} from "@/lib/types/online-resume";

export default function NewOnlineResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyIdParam = searchParams.get("historyId");
  const { user } = useCloudData();

  const histories = useMemo(() => listHistory(), []);
  const versions = useMemo(() => listVersions(), []);

  const [resumeText, setResumeText] = useState(() => {
    if (!historyIdParam) return "";
    const h = listHistory().find((x) => x.id === historyIdParam);
    if (!h) return "";
    return (
      h.optimizedResume ||
      h.refine?.optimizedResumeHuman ||
      h.inputs.fullResume ||
      h.inputs.resumePreview ||
      ""
    );
  });
  const [targetRole, setTargetRole] = useState(() => {
    if (!historyIdParam) return "";
    return listHistory().find((x) => x.id === historyIdParam)?.meta.targetRole ?? "";
  });
  const [currentRole, setCurrentRole] = useState(() => {
    if (!historyIdParam) return "";
    return (
      listHistory().find((x) => x.id === historyIdParam)?.meta.currentRole ?? ""
    );
  });
  const [sourceType, setSourceType] = useState<OnlineResumeSourceType>(
    historyIdParam ? "history" : "manual",
  );
  const [sourceHistoryId, setSourceHistoryId] = useState<string | null>(
    historyIdParam,
  );
  const [sourceVersionId, setSourceVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const parsed = await parseResumeFile(file);
      setResumeText(parsed.text);
      setSourceType("pdf");
      setSourceHistoryId(null);
      setSourceVersionId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件解析失败");
    }
  };

  const handleGenerate = async () => {
    setError(null);
    if (resumeText.trim().length < 50) {
      setError("简历内容至少需要 50 个字符");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/generate-online-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRole || undefined,
          currentRole: currentRole || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "生成失败");
      }
      const result = json as GenerateOnlineResumeResponse;
      const now = new Date().toISOString();

      if (user) {
        const client = getBrowserSupabaseClient();
        if (!client) throw new Error("未配置 Supabase");
        const saved = await upsertCloudOnlineResume(client, user.id, {
          title: result.suggestedTitle,
          themeId: result.suggestedThemeId ?? "clean",
          status: "draft",
          content: result.content,
          sourceType,
          sourceHistoryId,
          sourceVersionId,
        });
        router.push(`/online-resume/${saved.id}/edit`);
      } else {
        const localId = createLocalOnlineResumeId();
        upsertLocalOnlineResume({
          id: localId,
          slug: null,
          title: result.suggestedTitle,
          themeId: result.suggestedThemeId ?? "clean",
          status: "draft",
          content: result.content,
          sourceType,
          sourceHistoryId,
          sourceVersionId,
          createdAt: now,
          updatedAt: now,
        });
        router.push(`/online-resume/${localId}/edit`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">新建在线主页</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          上传 PDF，或从诊断历史 / 岗位版本导入内容，由 AI 生成求职主页结构。
        </p>

        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label>上传 PDF / DOCX</Label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>

          {histories.length > 0 && (
            <div className="space-y-2">
              <Label>从历史记录导入</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const h = histories.find((x) => x.id === selectedId);
                  if (!h) return;
                  setResumeText(
                    h.optimizedResume ||
                      h.refine?.optimizedResumeHuman ||
                      h.inputs.fullResume ||
                      h.inputs.resumePreview,
                  );
                  setTargetRole(h.meta.targetRole);
                  setCurrentRole(h.meta.currentRole ?? "");
                  setSourceType("history");
                  setSourceHistoryId(h.id);
                  setSourceVersionId(null);
                }}
              >
                <option value="">选择一条历史…</option>
                {histories.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {versions.length > 0 && (
            <div className="space-y-2">
              <Label>从岗位版本导入</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const v = versions.find((x) => x.id === selectedId);
                  if (!v) return;
                  setResumeText(v.humanResume || v.atsResume);
                  setTargetRole(v.targetRole);
                  setSourceType("version");
                  setSourceVersionId(v.id);
                  setSourceHistoryId(v.historyId);
                }}
              >
                <option value="">选择一个版本…</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>当前角色（可选）</Label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>目标岗位（可选）</Label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>简历文本</Label>
            <Textarea
              rows={14}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="粘贴简历正文…"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading}
            >
              {loading ? "生成中…" : "AI 生成主页"}
            </Button>
            <ButtonLink href="/online-resume" variant="outline">
              返回列表
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}

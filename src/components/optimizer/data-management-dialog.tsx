"use client";

import { useRef, useState } from "react";
import { CloudDownload, CloudUpload, Database, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  downloadBackup,
  buildBackupBundle,
  estimateStorageBytes,
  formatStorageSize,
  importBackup,
  isStorageNearLimit,
} from "@/lib/storage/backup";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { importLocalData } from "@/lib/supabase/import-local";
import { hydrateFromCloud } from "@/lib/supabase/sync";
import { useCloudData } from "@/components/layout/cloud-data-provider";

interface DataManagementDialogProps {
  onChanged?: () => void;
  /** 侧栏窄列：仅图标 + 短文案 */
  compact?: boolean;
}

export function DataManagementDialog({
  onChanged,
  compact,
}: DataManagementDialogProps) {
  const { user, status } = useCloudData();
  const [open, setOpen] = useState(false);
  const [merge, setMerge] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bytes = estimateStorageBytes();
  const nearLimit = isStorageNearLimit();
  const loggedIn = Boolean(user);

  const handleImport = async (file: File) => {
    setError(null);
    setMessage(null);
    const text = await file.text();
    const result = importBackup(text, { merge });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      loggedIn
        ? `已写入本地缓存：${result.counts.history} 条历史。登录态下次加载仍以云端为准；如需覆盖云端请使用「用本地覆盖云端」。`
        : `已导入：${result.counts.history} 条历史、${result.counts.versions} 个版本、${result.counts.applications} 条投递`,
    );
    onChanged?.();
  };

  const handleForceCloudUpload = async () => {
    setError(null);
    setMessage(null);
    const client = getBrowserSupabaseClient();
    if (!client) {
      setError("尚未配置 Supabase 云端同步。");
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error: userError } = await client.auth.getUser();
      if (userError || !data.user) {
        setError("请先从页面顶部登录。");
        return;
      }

      const bundle = buildBackupBundle();
      const result = await importLocalData(client, {
        userId: data.user.id,
        bundle,
      });
      setMessage(
        `已用本地缓存覆盖云端：${result.history} 条历史、${result.versions} 个版本、${result.applications} 条投递`,
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "云端同步失败，请稍后重试。");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    setError(null);
    setMessage(null);
    const client = getBrowserSupabaseClient();
    if (!client) {
      setError("尚未配置 Supabase 云端同步。");
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error: userError } = await client.auth.getUser();
      if (userError || !data.user) {
        setError("请先从页面顶部登录，再拉取云端数据。");
        return;
      }

      const counts = await hydrateFromCloud(client);
      setMessage(
        `已从云端覆盖本地：${counts.history} 条历史、${counts.versions} 个版本、${counts.applications} 条投递`,
      );
      onChanged?.();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "云端恢复失败，请稍后重试。");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={compact ? "outline" : "ghost"}
            size="sm"
            type="button"
            className={compact ? "h-7 gap-1 px-2 text-xs" : undefined}
            title="数据管理"
          />
        }
      >
        <Database className="size-3.5 shrink-0" />
        {compact ? "数据" : "数据管理"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>数据管理</DialogTitle>
          <DialogDescription>
            {loggedIn
              ? "已登录：业务数据以 Supabase 云端为准，本地仅为缓存。诊断/保存会自动同步。"
              : "未登录：数据仅保存在浏览器 localStorage。登录后将丢弃本地业务数据并加载该账号云端数据。"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            当前占用：<strong>{formatStorageSize(bytes)}</strong>
            {loggedIn && status === "loading" && (
              <span className="ml-2 text-muted-foreground">（正在同步云端…）</span>
            )}
            {nearLimit && (
              <span className="ml-2 text-destructive">（接近建议上限 4MB）</span>
            )}
          </p>
          {nearLimit && (
            <Alert variant="destructive">
              <AlertDescription>
                存储空间较大，请导出备份后清理旧历史，或删除不需要的版本/投递记录。
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadBackup}>
              <Download className="size-3.5" />
              导出 JSON 备份
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              导入备份
            </Button>
            {loggedIn && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloudRestore}
                  disabled={isSyncing}
                >
                  <CloudDownload className="size-3.5" />
                  {isSyncing ? "同步中…" : "重新拉取云端"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleForceCloudUpload}
                  disabled={isSyncing}
                >
                  <CloudUpload className="size-3.5" />
                  用本地覆盖云端
                </Button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="merge-backup"
              checked={merge}
              onCheckedChange={(c) => setMerge(c === true)}
            />
            <Label htmlFor="merge-backup" className="text-sm font-normal">
              JSON 导入时与现有记录合并（按 id），不勾选则覆盖
            </Label>
          </div>
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

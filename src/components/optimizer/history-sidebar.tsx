"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Pin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listVisible,
  type HistoryRecord,
} from "@/lib/storage/history";
import { HistoryManageDialog } from "./history-manage-dialog";
import { DataManagementDialog } from "./data-management-dialog";
import { cn } from "@/lib/utils";
import { subscribeCloudDataChanged } from "@/lib/supabase/cloud-events";

interface HistorySidebarProps {
  activeId?: string | null;
  onSelect: (record: HistoryRecord) => void;
}

export function HistorySidebar({ activeId, onSelect }: HistorySidebarProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(listVisible());
  }, []);

  // 客户端挂载后从 localStorage 同步一次；SSR 阶段渲染空列表
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(listVisible());
  }, []);

  useEffect(() => subscribeCloudDataChanged(refresh), [refresh]);

  return (
    <Card className="w-full min-w-0 border-border/80 shadow-none lg:sticky lg:top-20">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center gap-2">
          <History className="size-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-sm font-medium leading-none whitespace-nowrap">
            历史记录
          </CardTitle>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          最近 5 条 · 置顶优先展示
        </CardDescription>
        <div className="flex flex-wrap items-center gap-1.5">
          <DataManagementDialog onChanged={refresh} compact />
          <HistoryManageDialog onChanged={refresh} compact />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            完成一次优化后自动保存
          </p>
        ) : (
          records.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                activeId === r.id
                  ? "border-foreground/30 bg-muted/60"
                  : "border-border/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-snug">
                  {r.title}
                </p>
                {r.pinned && (
                  <Pin className="size-3 shrink-0 text-muted-foreground" />
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                {r.matchScore != null && ` · ${r.matchScore}分`}
              </p>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

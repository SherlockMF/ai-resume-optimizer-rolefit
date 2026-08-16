"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { ApplicationKanban } from "@/components/applications/application-kanban";
import { ButtonLink } from "@/components/ui/button";
import { subscribeCloudDataChanged } from "@/lib/supabase/cloud-events";

export default function ApplicationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(
    () =>
      subscribeCloudDataChanged(() => setRefreshKey((k) => k + 1)),
    [],
  );

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              v0.4 · 投递看板
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">投递进度看板</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              在优化页终稿完成后可一键加入；在此用下拉框更新状态并记录备注
            </p>
          </div>
          <ButtonLink href="/optimizer">去优化简历</ButtonLink>
        </div>

        <ApplicationKanban
          refreshKey={refreshKey}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      </main>
    </div>
  );
}

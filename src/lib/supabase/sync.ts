import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application } from "@/lib/storage/applications";
import {
  importBackup,
  type BackupBundle,
} from "@/lib/storage/backup";
import type { HistoryRecord } from "@/lib/storage/history";
import type { ResumeVersion } from "@/lib/storage/versions";
import { isBrowser } from "@/lib/storage/helpers";
import {
  buildCloudImportPayload,
  loadCloudBackup,
} from "@/lib/supabase/import-local";
import {
  notifyCloudDataChanged,
  notifyCloudSyncError,
} from "@/lib/supabase/cloud-events";

const STORAGE_KEYS = [
  "resume-optimizer-history",
  "resume-optimizer-versions",
  "resume-optimizer-applications",
] as const;

type JsonRecord = Record<string, unknown>;

export function clearLocalBusinessData(): void {
  if (!isBrowser()) return;
  for (const key of STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

async function upsert(
  client: SupabaseClient,
  table: string,
  rows: JsonRecord | JsonRecord[],
): Promise<void> {
  const list = Array.isArray(rows) ? rows : [rows];
  if (!list.length) return;
  const { error } = await client.from(table).upsert(list, { onConflict: "id" });
  if (error) throw new Error(`同步 ${table} 失败：${error.message}`);
}

async function removeRows(
  client: SupabaseClient,
  table: string,
  userId: string,
  column: string,
  value: string,
): Promise<void> {
  const { error } = await client
    .from(table)
    .delete()
    .eq("user_id", userId)
    .eq(column, value);
  if (error) throw new Error(`删除 ${table} 失败：${error.message}`);
}

/** 登录后：清空本地业务数据，再用云端全量覆盖 */
export async function hydrateFromCloud(client: SupabaseClient): Promise<{
  history: number;
  versions: number;
  applications: number;
}> {
  clearLocalBusinessData();
  const bundle = await loadCloudBackup(client);
  const result = importBackup(JSON.stringify(bundle), { merge: false });
  if (!result.ok) {
    throw new Error(result.error);
  }
  notifyCloudDataChanged();
  return result.counts;
}

export async function syncHistoryRecord(
  client: SupabaseClient,
  userId: string,
  record: HistoryRecord,
  related?: { versions?: ResumeVersion[]; applications?: Application[] },
): Promise<void> {
  const bundle: BackupBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    history: [record],
    versions: related?.versions ?? [],
    applications: related?.applications ?? [],
  };
  const payload = buildCloudImportPayload({ userId, bundle });

  await upsert(client, "profiles", payload.profile);
  await upsert(client, "resumes", payload.resumes);
  await upsert(client, "job_targets", payload.jobTargets);
  await upsert(client, "optimization_runs", payload.optimizationRuns);
  if (payload.resumeVersions.length) {
    await upsert(client, "resume_versions", payload.resumeVersions);
  }
}

export async function syncVersionRecord(
  client: SupabaseClient,
  userId: string,
  version: ResumeVersion,
  history: HistoryRecord | null,
): Promise<void> {
  if (!history) {
    throw new Error("同步版本失败：找不到对应历史记录");
  }
  await syncHistoryRecord(client, userId, history, { versions: [version] });
}

export async function syncApplicationRecord(
  client: SupabaseClient,
  userId: string,
  application: Application,
  history: HistoryRecord | null,
): Promise<void> {
  const bundle: BackupBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    history: history ? [history] : [],
    versions: [],
    applications: [application],
  };
  const payload = buildCloudImportPayload({ userId, bundle });

  if (payload.resumes.length) await upsert(client, "resumes", payload.resumes);
  await upsert(client, "job_targets", payload.jobTargets);
  if (payload.optimizationRuns.length) {
    await upsert(client, "optimization_runs", payload.optimizationRuns);
  }
  await upsert(client, "job_applications", payload.applications);
}

/** 删除一条历史：先子表再 run / resume / job_target（FK restrict） */
export async function deleteCloudHistory(
  client: SupabaseClient,
  userId: string,
  historyId: string,
): Promise<void> {
  await removeRows(client, "job_applications", userId, "job_target_id", historyId);
  await removeRows(client, "optimization_runs", userId, "id", historyId);
  await removeRows(client, "resumes", userId, "id", historyId);
  await removeRows(client, "job_targets", userId, "id", historyId);
}

export async function deleteCloudVersion(
  client: SupabaseClient,
  userId: string,
  versionId: string,
): Promise<void> {
  await removeRows(client, "resume_versions", userId, "id", versionId);
}

export async function deleteCloudApplication(
  client: SupabaseClient,
  userId: string,
  applicationId: string,
): Promise<void> {
  await removeRows(client, "job_applications", userId, "id", applicationId);
}

export function scheduleCloudTask(task: () => Promise<void>): void {
  void task().catch((error) => {
    const message =
      error instanceof Error ? error.message : "云端同步失败，请稍后重试";
    console.warn("[cloud-sync]", error);
    notifyCloudSyncError(message);
  });
}

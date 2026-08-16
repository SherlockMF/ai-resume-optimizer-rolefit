import type { DiagnoseResponse } from "@/lib/types/diagnose";
import type { RefineResponse } from "@/lib/types/refine";
import type {
  HistoryMeta,
  OptimizeResumeRequest,
} from "@/lib/types/resume-optimization";
import type { HistoryExtras } from "@/lib/storage/helpers";
import {
  buildMetaFromInputs,
  isBrowser,
  notifyStorageQuota,
  safeSetItem,
} from "@/lib/storage/helpers";
import { getCloudSyncHooks } from "@/lib/supabase/sync-hooks";

const STORAGE_KEY = "resume-optimizer-history";
const MAX_RECORDS = 20;
const MAX_PINNED = 5;
const VISIBLE_SLOTS = 5;

export interface HistoryInputs {
  resumePreview: string;
  jdPreview: string;
  fullResume?: string;
  fullJd?: string;
}

export interface HistoryRecord {
  id: string;
  createdAt: string;
  title: string;
  pinned: boolean;
  meta: HistoryMeta;
  inputs: HistoryInputs;
  diagnose: DiagnoseResponse;
  refine?: RefineResponse;
  optimizedResume?: string;
  matchScore?: number;
  extras?: HistoryExtras;
}

function truncate(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function deriveTitle(
  jd: string,
  targetRole: string,
  company?: string,
): string {
  if (company) return `${company} · ${targetRole}`;
  const firstLine = jd.split("\n").find((l) => l.trim())?.trim();
  if (firstLine && firstLine.length <= 40) return firstLine;
  return `${targetRole} · ${new Date().toLocaleDateString("zh-CN")}`;
}

function migrateRecord(record: HistoryRecord): HistoryRecord {
  if (!record.meta?.targetRole) {
    return {
      ...record,
      meta: {
        currentRole: "城市规划师",
        targetRole: "AI产品经理",
      },
    };
  }
  if (!record.meta.currentRole) {
    return {
      ...record,
      meta: { ...record.meta, currentRole: "城市规划师" },
    };
  }
  return record;
}

function readAll(): HistoryRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryRecord[];
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed.map((r) => migrateRecord(r));
    const needsPersist = migrated.some(
      (r, i) =>
        !parsed[i].meta?.targetRole || !parsed[i].meta?.currentRole,
    );
    if (needsPersist) writeAll(migrated);
    return migrated;
  } catch {
    return [];
  }
}

function writeAll(records: HistoryRecord[]): void {
  const result = safeSetItem(STORAGE_KEY, JSON.stringify(records));
  if (!result.ok && result.reason === "quota") notifyStorageQuota();
}

/** 侧栏展示：pinned 优先，再按时间填满 5 槽 */
export function listVisible(): HistoryRecord[] {
  const all = readAll();
  const pinned = all
    .filter((r) => r.pinned)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unpinned = all
    .filter((r) => !r.pinned)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const merged = [...pinned, ...unpinned];
  return merged.slice(0, VISIBLE_SLOTS);
}

export function listAll(): HistoryRecord[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function load(id: string): HistoryRecord | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export interface SaveHistoryParams {
  inputs: OptimizeResumeRequest;
  diagnose: DiagnoseResponse;
  refine?: RefineResponse;
  optimizedResume?: string;
}

/** 诊断完成即保存草稿，终稿后 update 同一条或新建 */
export function saveDiagnoseDraft(params: {
  inputs: OptimizeResumeRequest;
  diagnose: DiagnoseResponse;
}): HistoryRecord {
  return save({
    inputs: params.inputs,
    diagnose: params.diagnose,
  });
}

export function save(params: SaveHistoryParams): HistoryRecord {
  const all = readAll();
  const meta = buildMetaFromInputs(params.inputs);
  const record: HistoryRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    title: deriveTitle(
      params.inputs.targetJobDescription,
      params.inputs.targetRole,
      params.inputs.targetCompany,
    ),
    pinned: false,
    meta,
    inputs: {
      resumePreview: truncate(params.inputs.originalResumeText),
      jdPreview: truncate(params.inputs.targetJobDescription),
      fullResume: params.inputs.originalResumeText,
      fullJd: params.inputs.targetJobDescription,
    },
    diagnose: params.diagnose,
    refine: params.refine,
    optimizedResume: params.optimizedResume,
    matchScore: params.diagnose.jdMatch?.overall ?? params.diagnose.overallScore,
  };

  const next = [record, ...all].slice(0, MAX_RECORDS);
  writeAll(next);
  getCloudSyncHooks().onHistorySaved?.(record);
  return record;
}

export function update(
  id: string,
  patch: Partial<
    Pick<
      HistoryRecord,
      | "refine"
      | "optimizedResume"
      | "pinned"
      | "diagnose"
      | "matchScore"
      | "extras"
    >
  >,
): HistoryRecord | null {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
  getCloudSyncHooks().onHistorySaved?.(all[idx]);
  return all[idx];
}

export function togglePin(id: string): { record: HistoryRecord | null; error?: string } {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return { record: null };

  const record = all[idx];
  if (!record.pinned) {
    const pinnedCount = all.filter((r) => r.pinned).length;
    if (pinnedCount >= MAX_PINNED) {
      return {
        record: null,
        error: `最多保留 ${MAX_PINNED} 条置顶记录，请先取消其他置顶`,
      };
    }
    record.pinned = true;
  } else {
    record.pinned = false;
  }

  writeAll(all);
  getCloudSyncHooks().onHistorySaved?.(record);
  return { record };
}

export function remove(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
  getCloudSyncHooks().onHistoryDeleted?.(id);
}

export function clearUnpinned(): void {
  const kept = readAll().filter((r) => r.pinned);
  const removed = readAll().filter((r) => !r.pinned);
  writeAll(kept);
  const hooks = getCloudSyncHooks();
  for (const record of removed) {
    hooks.onHistoryDeleted?.(record.id);
  }
}

export const HISTORY_LIMITS = {
  MAX_RECORDS,
  MAX_PINNED,
  VISIBLE_SLOTS,
};

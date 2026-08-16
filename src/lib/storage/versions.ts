import type { HistoryMeta } from "@/lib/types/resume-optimization";
import {
  buildVersionLabel,
  isBrowser,
  notifyStorageQuota,
  safeSetItem,
} from "@/lib/storage/helpers";
import { listAll as listHistory, load as loadHistory } from "@/lib/storage/history";
import { getCloudSyncHooks } from "@/lib/supabase/sync-hooks";

const STORAGE_KEY = "resume-optimizer-versions";
const MAX_VERSIONS = 30;

export interface ResumeVersion {
  id: string;
  historyId: string;
  label: string;
  targetRole: string;
  targetCompany?: string;
  targetIndustry?: string;
  matchScore?: number;
  humanResume: string;
  atsResume: string;
  summary: string;
  keywordsMatched?: string[];
  keywordsMissing?: string[];
  applicationReason?: string;
  createdAt: string;
  isPinned: boolean;
}

function readAll(): ResumeVersion[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResumeVersion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ResumeVersion[]): void {
  const result = safeSetItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_VERSIONS)),
  );
  if (!result.ok && result.reason === "quota") notifyStorageQuota();
}

export function listVersions(): ResumeVersion[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getVersion(id: string): ResumeVersion | null {
  return readAll().find((v) => v.id === id) ?? null;
}

function buildVersionPayload(
  historyId: string,
  record: NonNullable<ReturnType<typeof loadHistory>>,
): ResumeVersion {
  const meta: HistoryMeta = record.meta ?? {
    currentRole: "城市规划师",
    targetRole: "AI产品经理",
  };
  const human =
    record.optimizedResume ?? record.refine?.optimizedResumeHuman ?? "";
  const ats = record.refine?.optimizedResumeAts ?? "";

  return {
    id: crypto.randomUUID(),
    historyId,
    label: buildVersionLabel(meta),
    targetRole: meta.targetRole,
    targetCompany: meta.targetCompany,
    targetIndustry: meta.targetIndustry,
    matchScore: record.matchScore,
    humanResume: human,
    atsResume: ats,
    summary: human.slice(0, 300),
    keywordsMatched: record.diagnose.keywords?.matched ?? [],
    keywordsMissing: record.diagnose.keywords?.missing ?? [],
    applicationReason: record.diagnose.applicationStrategy?.reason,
    createdAt: new Date().toISOString(),
    isPinned: false,
  };
}

/** 按 historyId 唯一：已有则更新，否则新建 */
export function saveVersionFromHistory(historyId: string): ResumeVersion | null {
  const record = loadHistory(historyId);
  if (!record?.refine) return null;

  const all = readAll();
  const idx = all.findIndex((v) => v.historyId === historyId);
  const payload = buildVersionPayload(historyId, record);

  if (idx >= 0) {
    const existing = all[idx];
    all[idx] = {
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      isPinned: existing.isPinned,
    };
    writeAll(all);
    getCloudSyncHooks().onVersionSaved?.(all[idx]);
    return all[idx];
  }

  writeAll([payload, ...all]);
  getCloudSyncHooks().onVersionSaved?.(payload);
  return payload;
}

export function toggleVersionPin(id: string): ResumeVersion | null {
  const all = readAll();
  const idx = all.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  all[idx].isPinned = !all[idx].isPinned;
  writeAll(all);
  getCloudSyncHooks().onVersionSaved?.(all[idx]);
  return all[idx];
}

export function removeVersion(id: string): void {
  writeAll(readAll().filter((v) => v.id !== id));
  getCloudSyncHooks().onVersionDeleted?.(id);
}

export interface VersionKeywordDiff {
  onlyInA: string[];
  onlyInB: string[];
  sharedMissing: string[];
}

export interface VersionCompareResult {
  a: ResumeVersion;
  b: ResumeVersion;
  scoreDiff: number;
  labelDiff: string;
  keywordDiff: VersionKeywordDiff;
}

export function compareVersions(
  idA: string,
  idB: string,
): VersionCompareResult | null {
  const a = getVersion(idA);
  const b = getVersion(idB);
  if (!a || !b) return null;

  const setA = new Set(a.keywordsMatched ?? []);
  const setB = new Set(b.keywordsMatched ?? []);
  const onlyInA = [...setA].filter((k) => !setB.has(k));
  const onlyInB = [...setB].filter((k) => !setA.has(k));
  const missA = new Set(a.keywordsMissing ?? []);
  const missB = new Set(b.keywordsMissing ?? []);
  const sharedMissing = [...missA].filter((k) => missB.has(k));

  return {
    a,
    b,
    scoreDiff: (a.matchScore ?? 0) - (b.matchScore ?? 0),
    labelDiff: `${a.label} vs ${b.label}`,
    keywordDiff: { onlyInA, onlyInB, sharedMissing },
  };
}

/** 迁移：从历史记录补全版本列表 */
export function syncVersionsFromHistory(): void {
  for (const record of listHistory()) {
    if (record.refine) {
      saveVersionFromHistory(record.id);
    }
  }
}

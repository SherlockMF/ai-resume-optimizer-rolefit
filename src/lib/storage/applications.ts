import { load as loadHistory } from "@/lib/storage/history";
import {
  isBrowser,
  notifyStorageQuota,
  safeSetItem,
} from "@/lib/storage/helpers";
import { getCloudSyncHooks } from "@/lib/supabase/sync-hooks";

const STORAGE_KEY = "resume-optimizer-applications";
const MAX_APPS = 50;

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  historyId?: string;
  versionId?: string;
  matchScore?: number;
  appliedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: "待投递",
  applied: "已投递",
  interview: "面试中",
  offer: "Offer",
  rejected: "已拒绝",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
];

function readAll(): Application[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Application[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: Application[]): void {
  const result = safeSetItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_APPS)),
  );
  if (!result.ok && result.reason === "quota") notifyStorageQuota();
}

export function listApplications(): Application[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listByStatus(status: ApplicationStatus): Application[] {
  return listApplications().filter((a) => a.status === status);
}

export function createApplication(
  data: Omit<Application, "id" | "createdAt" | "updatedAt">,
): Application {
  const now = new Date().toISOString();
  const app: Application = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  writeAll([app, ...readAll()]);
  getCloudSyncHooks().onApplicationSaved?.(app);
  return app;
}

export function createFromHistory(historyId: string): Application | null {
  const record = loadHistory(historyId);
  if (!record) return null;
  const meta = record.meta;
  return createApplication({
    company: meta?.targetCompany ?? "未填写公司",
    role: meta?.targetRole ?? "目标岗位",
    status: "wishlist",
    historyId,
    matchScore: record.matchScore,
    notes: record.diagnose.applicationStrategy?.reason,
  });
}

export function updateApplication(
  id: string,
  patch: Partial<
    Pick<Application, "status" | "notes" | "appliedAt" | "company" | "role">
  >,
): Application | null {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  getCloudSyncHooks().onApplicationSaved?.(all[idx]);
  return all[idx];
}

export function removeApplication(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
  getCloudSyncHooks().onApplicationDeleted?.(id);
}

export function moveApplication(
  id: string,
  status: ApplicationStatus,
): Application | null {
  const patch: Partial<Application> = { status };
  if (status === "applied" && !readAll().find((a) => a.id === id)?.appliedAt) {
    patch.appliedAt = new Date().toISOString().slice(0, 10);
  }
  return updateApplication(id, patch);
}

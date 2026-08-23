import { isBrowser, safeSetItem } from "@/lib/storage/helpers";
import type { OnlineResumePageRecord } from "@/lib/types/online-resume";
import { onlineResumeContentSchema } from "@/lib/types/online-resume";

const STORAGE_KEY = "rolefit-online-resume-drafts";

function readAll(): OnlineResumePageRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OnlineResumePageRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => {
      const ok = onlineResumeContentSchema.safeParse(item.content);
      return ok.success && typeof item.id === "string";
    });
  } catch {
    return [];
  }
}

function writeAll(items: OnlineResumePageRecord[]): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

export function listLocalOnlineResumes(): OnlineResumePageRecord[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalOnlineResume(
  id: string,
): OnlineResumePageRecord | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function upsertLocalOnlineResume(
  record: OnlineResumePageRecord,
): OnlineResumePageRecord {
  const all = readAll().filter((item) => item.id !== record.id);
  const next = { ...record, updatedAt: new Date().toISOString() };
  writeAll([next, ...all]);
  return next;
}

export function removeLocalOnlineResume(id: string): void {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function createLocalOnlineResumeId(): string {
  return `local-${crypto.randomUUID()}`;
}

export function isLocalOnlineResumeId(id: string): boolean {
  return id.startsWith("local-");
}

import type { Application } from "@/lib/storage/applications";
import type { HistoryRecord } from "@/lib/storage/history";
import type { ResumeVersion } from "@/lib/storage/versions";

export type CloudSyncHooks = {
  onHistorySaved?: (record: HistoryRecord) => void;
  onHistoryDeleted?: (historyId: string) => void;
  onVersionSaved?: (version: ResumeVersion) => void;
  onVersionDeleted?: (versionId: string) => void;
  onApplicationSaved?: (application: Application) => void;
  onApplicationDeleted?: (applicationId: string) => void;
};

let syncHooks: CloudSyncHooks = {};

export function setCloudSyncHooks(hooks: CloudSyncHooks): void {
  syncHooks = hooks;
}

export function getCloudSyncHooks(): CloudSyncHooks {
  return syncHooks;
}

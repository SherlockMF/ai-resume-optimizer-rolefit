/** 云端 hydrate / 写穿完成后通知 UI 刷新本地列表 */
export const CLOUD_DATA_EVENT = "rolefit:cloud-data";
export const CLOUD_SYNC_ERROR_EVENT = "rolefit:cloud-sync-error";

export function notifyCloudDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLOUD_DATA_EVENT));
}

export function notifyCloudSyncError(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CLOUD_SYNC_ERROR_EVENT, { detail: { message } }),
  );
}

export function subscribeCloudDataChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CLOUD_DATA_EVENT, handler);
  return () => window.removeEventListener(CLOUD_DATA_EVENT, handler);
}

export function subscribeCloudSyncError(
  handler: (message: string) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ message?: string }>).detail;
    handler(detail?.message ?? "云端同步失败");
  };
  window.addEventListener(CLOUD_SYNC_ERROR_EVENT, listener);
  return () => window.removeEventListener(CLOUD_SYNC_ERROR_EVENT, listener);
}

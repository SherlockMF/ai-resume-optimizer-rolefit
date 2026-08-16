"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { load as loadHistory } from "@/lib/storage/history";
import { listVersions } from "@/lib/storage/versions";
import {
  clearLocalBusinessData,
  deleteCloudApplication,
  deleteCloudHistory,
  deleteCloudVersion,
  hydrateFromCloud,
  scheduleCloudTask,
  syncApplicationRecord,
  syncHistoryRecord,
  syncVersionRecord,
} from "@/lib/supabase/sync";
import { setCloudSyncHooks } from "@/lib/supabase/sync-hooks";
import {
  notifyCloudDataChanged,
  subscribeCloudSyncError,
} from "@/lib/supabase/cloud-events";

type CloudStatus = "idle" | "loading" | "ready" | "error";

type CloudDataContextValue = {
  user: User | null;
  status: CloudStatus;
  error: string | null;
  syncError: string | null;
  retryHydrate: () => void;
  clearSyncError: () => void;
};

const CloudDataContext = createContext<CloudDataContextValue>({
  user: null,
  status: "idle",
  error: null,
  syncError: null,
  retryHydrate: () => undefined,
  clearSyncError: () => undefined,
});

export function useCloudData(): CloudDataContextValue {
  return useContext(CloudDataContext);
}

export function CloudDataProvider({ children }: { children: React.ReactNode }) {
  const client = getBrowserSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CloudStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);

  const runHydrate = useCallback(
    async (nextUser: User) => {
      if (!client) return;
      setCloudSyncHooks({});
      clearLocalBusinessData();
      notifyCloudDataChanged();
      setStatus("loading");
      setError(null);
      try {
        await hydrateFromCloud(client);
        userRef.current = nextUser;
        setUser(nextUser);
        setStatus("ready");
        // 写穿仅在云端 hydrate 成功后启用，避免登录瞬间把旧本地数据推回云端
        setCloudSyncHooks({
          onHistorySaved: (record) => {
            const versions = listVersions().filter(
              (v) => v.historyId === record.id,
            );
            scheduleCloudTask(() =>
              syncHistoryRecord(client, nextUser.id, record, { versions }),
            );
          },
          onHistoryDeleted: (historyId) => {
            scheduleCloudTask(() =>
              deleteCloudHistory(client, nextUser.id, historyId),
            );
          },
          onVersionSaved: (version) => {
            const history = loadHistory(version.historyId);
            scheduleCloudTask(() =>
              syncVersionRecord(client, nextUser.id, version, history),
            );
          },
          onVersionDeleted: (versionId) => {
            scheduleCloudTask(() =>
              deleteCloudVersion(client, nextUser.id, versionId),
            );
          },
          onApplicationSaved: (application) => {
            const history = application.historyId
              ? loadHistory(application.historyId)
              : null;
            scheduleCloudTask(() =>
              syncApplicationRecord(client, nextUser.id, application, history),
            );
          },
          onApplicationDeleted: (applicationId) => {
            scheduleCloudTask(() =>
              deleteCloudApplication(client, nextUser.id, applicationId),
            );
          },
        });
      } catch (hydrateError) {
        userRef.current = nextUser;
        setUser(nextUser);
        setStatus("error");
        setError(
          hydrateError instanceof Error
            ? hydrateError.message
            : "云端数据加载失败",
        );
        notifyCloudDataChanged();
      }
    },
    [client],
  );

  const retryHydrate = useCallback(() => {
    if (userRef.current) void runHydrate(userRef.current);
  }, [runHydrate]);

  useEffect(() => {
    return subscribeCloudSyncError((message) => setSyncError(message));
  }, []);

  useEffect(() => {
    if (!client) {
      setCloudSyncHooks({});
      return;
    }

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;

      if (event === "TOKEN_REFRESHED") {
        if (nextUser) {
          userRef.current = nextUser;
          setUser(nextUser);
        }
        return;
      }

      if (!nextUser) {
        hydratedUserIdRef.current = null;
        userRef.current = null;
        setCloudSyncHooks({});
        clearLocalBusinessData();
        setUser(null);
        setStatus("idle");
        setError(null);
        notifyCloudDataChanged();
        return;
      }

      if (event === "SIGNED_IN") {
        hydratedUserIdRef.current = nextUser.id;
        void runHydrate(nextUser);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        if (hydratedUserIdRef.current === nextUser.id) {
          userRef.current = nextUser;
          setUser(nextUser);
          return;
        }
        hydratedUserIdRef.current = nextUser.id;
        void runHydrate(nextUser);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      setCloudSyncHooks({});
    };
  }, [client, runHydrate]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      syncError,
      retryHydrate,
      clearSyncError: () => setSyncError(null),
    }),
    [user, status, error, syncError, retryHydrate],
  );

  return (
    <CloudDataContext.Provider value={value}>
      {children}
      {client && status === "loading" && (
        <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] flex justify-center px-4">
          <p className="rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            正在加载云端数据…
          </p>
        </div>
      )}
      {client && status === "error" && error && (
        <div className="fixed inset-x-0 top-14 z-[60] flex justify-center px-4">
          <div className="flex max-w-lg items-center gap-2 rounded-md border border-destructive/40 bg-background px-3 py-2 text-xs text-destructive shadow-sm">
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              className="shrink-0 underline"
              onClick={retryHydrate}
            >
              重试
            </button>
          </div>
        </div>
      )}
      {syncError && (
        <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
          <div className="flex max-w-lg items-center gap-2 rounded-md border border-amber-500/40 bg-background px-3 py-2 text-xs text-amber-800 shadow-sm dark:text-amber-200">
            <span className="min-w-0 flex-1">
              已保存到本机，云端同步失败：{syncError}
            </span>
            <button
              type="button"
              className="shrink-0 underline"
              onClick={() => setSyncError(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </CloudDataContext.Provider>
  );
}

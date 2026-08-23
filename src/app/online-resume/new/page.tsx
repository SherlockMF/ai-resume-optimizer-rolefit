import { Suspense } from "react";
import NewOnlineResumePage from "./new-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          加载中…
        </div>
      }
    >
      <NewOnlineResumePage />
    </Suspense>
  );
}

type AuthSuccessHandler = () => void;

let openHandler: ((opts?: { onSuccess?: AuthSuccessHandler }) => void) | null =
  null;
let pendingSuccess: AuthSuccessHandler | null = null;

export function registerAuthDialogOpener(
  handler: (opts?: { onSuccess?: AuthSuccessHandler }) => void,
): () => void {
  openHandler = handler;
  return () => {
    if (openHandler === handler) openHandler = null;
  };
}

/** 原地打开登录弹窗；登录成功后执行 onSuccess（不整页跳转） */
export function openAuthDialog(opts?: {
  onSuccess?: AuthSuccessHandler;
}): void {
  pendingSuccess = opts?.onSuccess ?? null;
  if (openHandler) {
    openHandler(opts);
    return;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rolefit:open-auth", { detail: opts }),
    );
  }
}

export function consumeAuthSuccessHandler(): AuthSuccessHandler | null {
  const fn = pendingSuccess;
  pendingSuccess = null;
  return fn;
}

export function notifyAuthSuccess(): void {
  const fn = consumeAuthSuccessHandler();
  fn?.();
}

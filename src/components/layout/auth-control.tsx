"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Sparkles, UserPlus, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  consumeAuthSuccessHandler,
  notifyAuthSuccess,
  registerAuthDialogOpener,
} from "@/lib/auth/auth-dialog";

type AuthMode = "login" | "register";

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "邮箱或密码不正确";
  }
  if (lower.includes("user already registered")) {
    return "该邮箱已注册，请直接登录";
  }
  if (lower.includes("password should be at least")) {
    return "密码至少需要 6 个字符";
  }
  if (lower.includes("unable to validate email")) {
    return "邮箱格式不正确";
  }
  if (lower.includes("email rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "邮件发送过于频繁，请稍后再试";
  }
  if (lower.includes("email not confirmed")) {
    return "请先到邮箱点击确认链接，再登录";
  }
  return message;
}

export function AuthControl() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const client = getBrowserSupabaseClient();

  useEffect(() => {
    if (!client) return;

    client.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!client) return;
    return registerAuthDialogOpener(() => {
      if (user) {
        notifyAuthSuccess();
        return;
      }
      setMode("login");
      setOpen(true);
    });
  }, [client, user]);

  if (!client) return null;

  const resetFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setPassword("");
    resetFeedback();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    resetFeedback();

    if (password.length < 6) {
      setError("密码至少需要 6 个字符");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message));
        setLoading(false);
        return;
      }

      setPassword("");
      setOpen(false);
      setLoading(false);
      notifyAuthSuccess();
      return;
    }

    const { data, error: signUpError } = await client.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(mapAuthError(signUpError.message));
      setLoading(false);
      return;
    }

    // 若开启「注册需邮件确认」，session 可能为空
    if (!data.session) {
      setMessage("注册成功。若已开启邮箱确认，请查收邮件后再登录。");
      setMode("login");
      setPassword("");
      setLoading(false);
      return;
    }

    setPassword("");
    setOpen(false);
    setLoading(false);
    notifyAuthSuccess();
  };

  const handleSignOut = async () => {
    setLoading(true);
    await client.auth.signOut();
    setOpen(false);
    setLoading(false);
  };

  if (user) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              title="账户"
            />
          }
        >
          <UserRound />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>账户</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <ButtonLink href="/billing" variant="outline">
            订阅 Pro
          </ButtonLink>
          <Button type="button" variant="outline" onClick={handleSignOut} disabled={loading}>
            <LogOut />
            退出登录
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPassword("");
          resetFeedback();
          // 用户取消登录时丢弃待续跑回调，避免下次误触发
          consumeAuthSuccessHandler();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title="登录或注册"
          />
        }
      >
        <LogIn />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-700" />
            RoleFit
          </DialogTitle>
          <DialogDescription>使用邮箱和密码登录或创建账户。</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
              mode === "login"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => switchMode("login")}
          >
            <LogIn className="size-3.5" />
            登录
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
              mode === "register"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => switchMode("register")}
          >
            <UserPlus className="size-3.5" />
            注册
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">邮箱</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">密码</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 个字符"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? <LogIn /> : <UserPlus />}
            {loading
              ? mode === "login"
                ? "登录中…"
                : "注册中…"
              : mode === "login"
                ? "登录"
                : "注册"}
          </Button>
        </form>

        {message && (
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}

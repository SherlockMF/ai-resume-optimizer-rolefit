import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { AuthControl } from "./auth-control";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold">
            RF
          </span>
          <span className="text-foreground">RoleFit</span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            v0.5
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <ButtonLink href="/" variant="ghost" size="sm">
            首页
          </ButtonLink>
          <ButtonLink href="/versions" variant="ghost" size="sm">
            岗位版本
          </ButtonLink>
          <ButtonLink href="/online-resume" variant="ghost" size="sm">
            在线简历
          </ButtonLink>
          <ButtonLink href="/billing" variant="ghost" size="sm">
            订阅
          </ButtonLink>
          <ButtonLink href="/applications" variant="ghost" size="sm">
            投递看板
          </ButtonLink>
          <ButtonLink href="/changelog" variant="ghost" size="sm">
            更新说明
          </ButtonLink>
          <ButtonLink href="/optimizer" size="sm">
            开始优化
          </ButtonLink>
          <AuthControl />
        </nav>
      </div>
    </header>
  );
}

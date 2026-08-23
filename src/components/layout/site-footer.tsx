import Link from "next/link";
import { SITE_SUPPORT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} RoleFit · lomivex.top</p>
        <p>
          客服邮箱：
          <a
            className="text-foreground underline underline-offset-2 hover:text-foreground/80"
            href={`mailto:${SITE_SUPPORT_EMAIL}`}
          >
            {SITE_SUPPORT_EMAIL}
          </a>
        </p>
        <nav className="flex gap-4">
          <Link href="/pricing" className="hover:text-foreground">
            定价
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            服务条款
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            隐私政策
          </Link>
        </nav>
      </div>
    </footer>
  );
}

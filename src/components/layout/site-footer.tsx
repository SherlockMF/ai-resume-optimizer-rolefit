import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>© {new Date().getFullYear()} RoleFit · lomivex.top</p>
        <nav className="flex gap-4">
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

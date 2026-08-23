import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const coreMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260816000000_rolefit_core.sql",
);
const onlineResumeMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260821000000_online_resume_pages.sql",
);
const waffoBillingMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260823000000_waffo_billing.sql",
);

describe("RoleFit Supabase schema", () => {
  it("defines all product tables with RLS policies", () => {
    expect(existsSync(coreMigrationPath)).toBe(true);

    const sql = readFileSync(coreMigrationPath, "utf8");
    for (const table of [
      "profiles",
      "user_entitlements",
      "resumes",
      "job_targets",
      "optimization_runs",
      "resume_versions",
      "job_applications",
      "application_events",
      "ai_usage_events",
    ]) {
      expect(sql).toContain(`create table public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }

    expect(sql).toContain("to authenticated");
    expect(sql).toContain("(select auth.uid()) = user_id");
  });

  it("defines online resume pages with RLS, grants, and usage feature key", () => {
    expect(existsSync(onlineResumeMigrationPath)).toBe(true);
    const sql = readFileSync(onlineResumeMigrationPath, "utf8");
    expect(sql).toContain("create table if not exists public.online_resume_pages");
    expect(sql).toContain(
      "alter table public.online_resume_pages enable row level security",
    );
    expect(sql).toContain("grant select on public.online_resume_pages to anon");
    expect(sql).toContain(
      "grant select, insert, update, delete on public.online_resume_pages to authenticated",
    );
    expect(sql).toContain("online_resume_pages_public_read");
    expect(sql).toContain("'online_resume'");
  });

  it("defines waffo webhook events and entitlement payment fields", () => {
    expect(existsSync(waffoBillingMigrationPath)).toBe(true);
    const sql = readFileSync(waffoBillingMigrationPath, "utf8");
    expect(sql).toContain("create table if not exists public.waffo_webhook_events");
    expect(sql).toContain("waffo_order_id");
    expect(sql).toContain("grant update on public.user_entitlements to service_role");
  });
});

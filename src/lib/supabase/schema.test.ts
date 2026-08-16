import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260816000000_rolefit_core.sql",
);

describe("RoleFit Supabase schema", () => {
  it("defines all product tables with RLS policies", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const sql = readFileSync(migrationPath, "utf8");
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
});

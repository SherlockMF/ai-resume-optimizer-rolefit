import { describe, expect, it } from "vitest";

describe("hasSupabaseEnv", () => {
  it("requires both public URL and publishable key", async () => {
    const modulePath = "./config";
    const config = (await import(modulePath)) as {
      hasSupabaseEnv: (env: Record<string, string | undefined>) => boolean;
    };

    expect(config.hasSupabaseEnv({})).toBe(false);
    expect(
      config.hasSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toBe(false);
    expect(
      config.hasSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toBe(true);
  });
});

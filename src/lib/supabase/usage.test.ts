import { describe, expect, it } from "vitest";

describe("hasAvailableAiUnits", () => {
  it("allows usage below the monthly limit and blocks usage at the limit", async () => {
    const modulePath = "./usage";
    const usage = (await import(modulePath)) as {
      hasAvailableAiUnits: (limit: number, used: number, requested?: number) => boolean;
    };

    expect(usage.hasAvailableAiUnits(10, 9)).toBe(true);
    expect(usage.hasAvailableAiUnits(10, 10)).toBe(false);
    expect(usage.hasAvailableAiUnits(10, 8, 2)).toBe(true);
    expect(usage.hasAvailableAiUnits(10, 9, 2)).toBe(false);
  });
});

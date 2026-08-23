import { describe, expect, it } from "vitest";
import {
  createEmptyOnlineResumeContent,
  onlineResumeContentSchema,
} from "../types/online-resume";
import { isValidSlug, suggestSlug } from "./slug";

describe("online resume content schema", () => {
  it("accepts empty template content", () => {
    const content = createEmptyOnlineResumeContent();
    const parsed = onlineResumeContentSchema.safeParse(content);
    expect(parsed.success).toBe(true);
  });
});

describe("slug helpers", () => {
  it("validates slug format and reserved words", () => {
    expect(isValidSlug("zhangsan-a7k2")).toBe(true);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("new")).toBe(false);
    expect(isValidSlug("Bad_Slug")).toBe(false);
  });

  it("suggests a valid slug", () => {
    const slug = suggestSlug("Test User");
    expect(isValidSlug(slug)).toBe(true);
  });
});

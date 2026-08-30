import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists only canonical public pages on the production domain", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://lomivex.top",
      "https://lomivex.top/optimizer",
      "https://lomivex.top/pricing",
      "https://lomivex.top/changelog",
      "https://lomivex.top/privacy",
      "https://lomivex.top/terms",
    ]);
  });

  it("does not expose workspace, API, auth, billing, or user resume routes", () => {
    const urls = sitemap().map((entry) => entry.url);

    for (const path of [
      "/applications",
      "/versions",
      "/online-resume",
      "/billing",
      "/api",
      "/auth",
      "/p/",
    ]) {
      expect(urls.some((url) => url.includes(path))).toBe(false);
    }
  });
});

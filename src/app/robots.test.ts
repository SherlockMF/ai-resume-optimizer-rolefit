import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows public crawling and advertises the production sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      sitemap: "https://lomivex.top/sitemap.xml",
      host: "https://lomivex.top",
    });
  });
});

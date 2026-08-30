import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/optimizer", "/pricing", "/changelog", "/privacy", "/terms"];

  return paths.map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
  }));
}

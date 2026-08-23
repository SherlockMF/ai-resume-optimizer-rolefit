export function slugifyBase(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return ascii || "page";
}

const RESERVED = new Set([
  "new",
  "edit",
  "api",
  "admin",
  "login",
  "p",
  "online-resume",
  "optimizer",
  "versions",
  "applications",
  "changelog",
  "auth",
  "rolefit",
]);

export function isValidSlug(slug: string): boolean {
  if (!/^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$/.test(slug)) return false;
  if (slug.length < 3 || slug.length > 48) return false;
  if (RESERVED.has(slug)) return false;
  return true;
}

export function suggestSlug(displayName: string): string {
  const base = slugifyBase(displayName).slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 6);
  const candidate = `${base}-${suffix}`;
  return isValidSlug(candidate) ? candidate : `page-${suffix}${Date.now().toString(36).slice(-4)}`;
}

export function publicPagePath(slug: string): string {
  return `/p/${slug}`;
}

export function publicPageUrl(slug: string, origin?: string): string {
  const path = publicPagePath(slug);
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

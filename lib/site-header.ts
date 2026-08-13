export type SiteHeaderTone = "light" | "dark";

export function getSiteHeaderClasses(
  scrolled: boolean,
  tone: SiteHeaderTone,
) {
  return [
    scrolled ? "site-header--scrolled" : "site-header--top",
    `site-header--tone-${tone}`,
  ].join(" ");
}

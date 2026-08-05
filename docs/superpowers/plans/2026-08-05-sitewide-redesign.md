# Tùng Phát Sitewide Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every public Tùng Phát route to the light corporate design system established by homepage commit `cc33734e73e4cc351da140f0f505e16fb0898a89` while preserving SEO, content, accessibility, performance, and active URLs.

**Architecture:** Build one shared site shell and a small set of semantic page primitives, then migrate route groups from the legacy dark chrome to those primitives. Keep content/data loading and metadata on the server; limit client code to navigation and existing interactive widgets.

**Tech Stack:** Next.js 15 App Router static export, React 19, TypeScript, Tailwind CSS 3, Vitest, Playwright, Axe, Lighthouse.

## Global Constraints

- Work only on branch `codex/landingpage`; do not merge, push, or deploy.
- Preserve all active slugs, redirects, SEO content, business data, and production integrations.
- Use solid light header/mobile navigation/footer surfaces; no `backdrop-filter`, blur, glass, or dark full-height hero.
- Do not invent price, stock, delivery time, technical tolerances, official distribution status, customer names, case studies, or catalogue files.
- Maintain one H1, self-canonical metadata, breadcrumb schema, WCAG AA, 44px targets, no horizontal overflow, CLS below 0.1, and homepage LCP at or below 2.5 seconds when the local Lighthouse environment permits.
- Add no dependency unless implementation is impossible with the existing stack.

---

### Task 1: Acceptance Tests For The Shared Site Contract

**Files:**
- Modify: `e2e/site.spec.ts`

**Interfaces:**
- Consumes: current exported public routes and browser-computed styles.
- Produces: acceptance coverage for `SiteHeader`, `SiteFooter`, `Breadcrumbs`, `StickyMobileActions`, SEO, overflow, images, console, and Axe.

- [ ] Add literal route fixtures covering homepage, product, MDF, CNC, brand, catalogue, contact, legal, empty listing, and noindex route.
- [ ] Replace legacy dark-header assertions with computed-style assertions: solid background, `backdropFilter === "none"`, and light footer main surface.
- [ ] Add tests for one H1, self-canonical, breadcrumbs, no broken images, no console errors, and no horizontal overflow at 375, 390, 768, 1280, 1440, and 1920 widths.
- [ ] Add keyboard tests for mobile menu open, focus placement, Escape close, focus return, and `aria-expanded`.
- [ ] Add Axe serious/critical coverage for the representative route groups.
- [ ] Run the targeted tests against the current export and confirm they fail because the legacy dark chrome/blur remains.

Run: `npx playwright test e2e/site.spec.ts --grep "shared site contract|mobile navigation contract|representative routes meet accessibility"`

Expected: FAIL on legacy header/footer computed styles and missing shared navigation behavior.

### Task 2: Semantic Tokens And Shared Site Primitives

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `components/site/SiteHeader.tsx`
- Create: `components/site/MobileNavigation.tsx`
- Create: `components/site/SiteFooter.tsx`
- Create: `components/site/SiteShell.tsx`
- Create: `components/site/StickyMobileActions.tsx`
- Create: `components/ui/PageContainer.tsx`
- Create: `components/ui/Breadcrumbs.tsx`
- Create: `components/ui/PageHero.tsx`
- Create: `components/ui/SectionHeader.tsx`
- Create: `components/ui/ButtonLink.tsx`
- Create: `components/ui/ContactCTA.tsx`
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ui/ResponsiveTable.tsx`

**Interfaces:**
- Produces: `SiteShell`, `PageHero`, `Breadcrumbs`, `SectionHeader`, `ButtonLink`, `ContactCTA`, `EmptyState`, and `ResponsiveTable` consumed by every route group.

- [ ] Define semantic CSS variables for brand colors, surfaces, text, border, focus, container, gutters, spacing, radii, shadows, controls, and motion.
- [ ] Implement the light sticky header and active desktop navigation using current pathname state.
- [ ] Implement the solid mobile drawer with focus management, Escape, route-close, scroll lock, and reduced-motion-safe transitions.
- [ ] Implement the compact light footer with business data, useful links, branch directions, and a narrow green copyright strip.
- [ ] Implement shared page primitives with server-component defaults and at least 44px interactive targets.
- [ ] Run the targeted Playwright tests and confirm the shared contract passes for the first migrated route.

### Task 3: Homepage Migration Without Content Regression

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/HomeContent.tsx`
- Modify: `components/home/HomeHero.tsx`
- Delete after all imports move: `components/home/HomeHeader.tsx`
- Delete after all imports move: `components/home/HomeFooter.tsx`

**Interfaces:**
- Consumes: `SiteShell`, `StickyMobileActions`, and semantic tokens.
- Preserves: homepage hero, requirement finder, conversion sections, metadata, and single priority image.

- [ ] Replace homepage-only header/footer/mobile bar with shared site components.
- [ ] Remove `bg-white/95` and `backdrop-blur-lg` from fixed/sticky actions.
- [ ] Preserve every existing homepage H2 and requirement finder behavior.
- [ ] Run homepage Playwright tests and Web Vitals lab assertions.

### Task 4: Product And Root Service Landing Migration

**Files:**
- Modify: `components/content/ProductLanding.tsx`
- Modify: `components/content/ServiceLanding.tsx`
- Modify: `components/content/FaqList.tsx`
- Modify: `components/content/MarkdownContent.tsx`

**Interfaces:**
- Consumes: shared shell, hero, breadcrumbs, CTA, responsive tables, and tokens.
- Preserves: frontmatter fields, Markdown body, specs, applications, advantages, limitations, ordering steps, FAQ, metadata, and schema.

- [ ] Render product hero with verified image, stock-check/request CTA, and compact breadcrumb.
- [ ] Render material specifications as readable summary cards/table with labelled mobile scrolling.
- [ ] Preserve unique gỗ ghép, MDF, MFC/plywood, and CNC content without copying between slugs.
- [ ] Add relevant internal links and a contextual final CTA without inventing data.
- [ ] Run product/service route acceptance tests and Axe.

### Task 5: Static Catalogue, CNC, Brand, And Catalogue Pages

**Files:**
- Modify: `app/san-pham/page.tsx`
- Modify: `app/gia-cong-cnc/page.tsx`
- Modify: `components/BrandPage.tsx`
- Modify: `components/CatalogueView.tsx`
- Modify: `app/san-pham/[brand]/page.tsx`
- Modify: `app/catalogue/[brand]/page.tsx`

**Interfaces:**
- Consumes: shared cards, empty state, shell, hero, CTA, and metadata helpers.

- [ ] Migrate material catalogue cards and add verified selection guidance/internal links.
- [ ] Rebuild CNC page around customer input, Tùng Phát processing, output, real machine imagery, quote process, and Zalo file CTA.
- [ ] Remove fake disabled brand filters and render honest product/catalogue availability.
- [ ] Render catalogue cards only for existing data; use an honest CTA/empty state when no PDF exists.
- [ ] Add self-canonical metadata and breadcrumb schema to brand/catalogue routes.
- [ ] Run representative brand/catalogue/CNC Playwright tests.

### Task 6: Workshop, Articles, Contact, Quote, Legal, And System Pages

**Files:**
- Modify: `app/du-an/page.tsx`
- Modify: `components/content/ProjectLanding.tsx`
- Modify: `app/bai-viet/page.tsx`
- Modify: `components/content/ArticleLanding.tsx`
- Modify: `app/lien-he/page.tsx`
- Modify: `components/contact/ContactHero.tsx`
- Modify: `components/contact/BranchLocation.tsx`
- Modify: `app/bao-gia/page.tsx`
- Modify: `components/LegalPage.tsx`
- Modify: `app/chinh-sach-bao-mat/page.tsx`
- Modify: `app/dieu-khoan-su-dung/page.tsx`
- Modify: `app/not-found.tsx`
- Modify: `app/error.tsx`

**Interfaces:**
- Consumes: shared shell, hero, section header, branch card, article card, empty state, and CTA.

- [ ] Use verified workshop/branch images on `/du-an/` when no case studies are published.
- [ ] Keep draft articles hidden and present a useful truthful listing empty state.
- [ ] Give future article/project detail renderers readable measure, heading hierarchy, related content, and shared chrome.
- [ ] Rebuild contact from central location config with real photos and lightweight directions links; remove map iframes.
- [ ] Keep `/bao-gia/` noindex and direct-contact only.
- [ ] Give legal and error pages simple light layouts with canonical/noindex behavior preserved.
- [ ] Run representative contact/legal/empty-listing tests and Axe.

### Task 7: Sitemap, Internal Links, And Route Completeness

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `e2e/site.spec.ts`
- Inspect: `scripts/check-internal-links.mjs` (the existing exported-HTML contract remains unchanged)

**Interfaces:**
- Produces: sitemap entries for all indexable exported routes and link validation with no new 404s.

- [ ] Add four brand routes and three existing catalogue routes to sitemap generation.
- [ ] Keep `/bao-gia/`, `/cms-preview/`, drafts, sentinels, and KES catalogue out.
- [ ] Verify every sitemap URL maps to exported HTML.
- [ ] Verify all internal links resolve and canonical paths match the current route.

### Task 8: Visual QA And Quality Gates

**Files:**
- Modify only files implicated by failures.
- Generate: `output/playwright/sitewide-final/*.png`
- Generate: `output/lighthouse/sitewide-final/*`

**Interfaces:**
- Produces: final screenshots and machine-readable verification artifacts.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run validate:links`.
- [ ] Run full Playwright tests and fix source-caused failures.
- [ ] Capture desktop/mobile screenshots for homepage, gỗ ghép, MDF, CNC, brand, and branch/contact routes at all required viewports.
- [ ] Run Axe on homepage and each representative route group; require no serious/critical violations.
- [ ] Run Lighthouse for homepage and the six required representative route categories; compare homepage performance with baseline.
- [ ] Search built CSS/source for forbidden blur/backdrop usage in public chrome and verify computed styles.
- [ ] Review screenshots for spacing, type hierarchy, card density, image treatment, overflow, and sticky-action/footer collisions.
- [ ] Commit all source, tests, and documentation on `codex/landingpage` without pushing.

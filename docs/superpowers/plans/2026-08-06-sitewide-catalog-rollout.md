# Sitewide Landing and Catalogue Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release the sitewide landing redesign safely, then integrate and redesign the supplier catalogue around high-intent code search and Melamine-first merchandising.

**Architecture:** Use one isolated rollout branch with separate landing and catalogue release boundaries. The shared landing design system owns site chrome and visual primitives; route-local catalogue modules own data, search, ranking, URL state, SEO/indexability, and supplier-specific content.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Playwright, static export, Cloudflare Pages, GitHub CLI.

## Global Constraints

- Work only in `/Users/khaduy/Downloads/tungphat-main-rollout`.
- Preserve production CMS, Cloudflare configuration, canonical domain, routes, business configuration, and SEO policies.
- Never use destructive reset/clean/restore commands, force push, DNS changes, custom-domain changes, or paid services.
- Landing production must be stable before catalogue integration begins.
- Catalogue media rights remain `UNCONFIRMED`; production catalogue deployment is blocked until explicitly authorized.
- Melamine codes precede supplier marketing sections; alphabetical ordering is only the final tie-breaker.
- Search/filter bundles load only on catalogue routes.

---

### Task 1: Establish the release baseline

**Files:**
- Create: `docs/releases/SITEWIDE_CATALOG_ROLLOUT_BASELINE.md`
- Create: `docs/superpowers/specs/2026-08-06-sitewide-catalog-rollout-design.md`
- Create: `docs/superpowers/plans/2026-08-06-sitewide-catalog-rollout.md`

**Interfaces:**
- Consumes: remote refs `origin/main`, `codex/landingpage`, `codex/catalog-suppliers-uiux-review`
- Produces: immutable rollback SHA and documented phase gates

- [ ] Record source SHAs, merge bases, commit ranges, changed-file counts, and direct overlap.
- [ ] Install locked dependencies with `npm ci` and run baseline `npm test`.
- [ ] Commit with `chore(release): prepare sitewide landing rollout`.

### Task 2: Merge the landing design system

**Files:**
- Modify: shared routes under `app/`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Create/modify: `components/site/**`, `components/ui/**`, `components/content/**`
- Remove through merge: legacy `components/Header.tsx`, `components/Footer.tsx`, `components/Hero.tsx`

**Interfaces:**
- Consumes: landing source `2e5d6f7f9e0002e08d050e1f26f275073aa3c24f`
- Produces: shared `SiteShell`, `SiteHeader`, `MobileNavigation`, `SiteFooter`, `StickyMobileActions`, `PageContainer`, `PageHero`, `Breadcrumbs`, `SectionHeader`, `ButtonLink`, `ContactCTA`, `EmptyState`, `ResponsiveTable`, and `LocalizedText`

- [ ] Run `git merge --no-ff codex/landingpage`.
- [ ] Resolve conflicts by preserving current-main CMS/SEO/infrastructure and using landing UI primitives as presentation truth.
- [ ] Search for imports/usages of legacy chrome and remove parallel header/footer rendering.
- [ ] Run targeted tests for shared chrome and public routes, then run full landing gates.
- [ ] Commit conflict resolutions separately if the merge requires them.

### Task 3: Verify and release landing production

**Files:**
- Modify only when failures require a scoped fix.
- Update: `docs/releases/SITEWIDE_CATALOG_ROLLOUT_BASELINE.md` with release SHAs and deployment evidence.

**Interfaces:**
- Consumes: passing landing build and deployed production URL
- Produces: stable `LANDING_RELEASE_SHA` and verified production baseline

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and repository static audits.
- [ ] Run Playwright for homepage, product/service/brand/contact/quote routes, mobile navigation, footer, language switch, 404, and `/cms-preview/`.
- [ ] Push the rollout branch, create/review a landing-only PR boundary, and merge it without force pushing.
- [ ] Deploy via the repository's existing Cloudflare Pages workflow without changing DNS or domains.
- [ ] Smoke test production at desktop `1440x900` and mobile `390x844`; stop and roll back to `PRE_LANDING_DEPLOY_SHA` if unstable.

### Task 4: Merge catalogue data and behavior

**Files:**
- Preserve: supplier data, adapters, import pipeline, media, routes, tests, structured data, sitemap registry, and noindex policies from the catalogue branch.
- Modify: `app/catalogue/**`, `app/thuong-hieu/**`, `app/san-pham/**`, catalogue components and shared sitemap/robots integration.

**Interfaces:**
- Consumes: catalogue source `53a3e44f1be94af2225c3a65e1813b1292a3bda2` and stable landing `main`
- Produces: all three suppliers inside the shared landing shell

- [ ] Synchronize rollout with the new `origin/main` using rebase only if the branch is unshared; otherwise merge.
- [ ] Merge the catalogue source and resolve the 17 direct overlaps.
- [ ] Keep catalogue data/behavior and discard catalogue-specific legacy chrome/CSS where shared primitives cover the requirement.
- [ ] Verify counts, canonical routes, noindex ratios, sitemap membership, and existing CTA/business configuration.

### Task 5: Implement code-first catalogue search and merchandising

**Files:**
- Modify/create focused catalogue search, ranking, filter-state, hub, card, and detail modules discovered after merge.
- Test: catalogue Vitest suites and Playwright journeys.

**Interfaces:**
- Produces: `normalizeCatalogueQuery(value: string): string`
- Produces: deterministic search ranking with exact normalized code first
- Produces: deterministic merchandising score with alphabetical comparison only after all demand signals tie
- Produces: URL state for `query`, `type`, `group`, and `supplier`

- [ ] Write failing tests for `BT111`, `BT 111`, `bt-111`, `SC020M`, supplier names with/without diacritics, unique exact navigation, and ambiguity handling.
- [ ] Write failing tests proving search precedes cards, selectors precede the grid, Melamine precedes supplier sections, and default order is not A-Z.
- [ ] Implement route-local search normalization/ranking and transparent heuristic scoring without unsupported sales claims.
- [ ] Implement accessible top-of-page search, primary chips, optional secondary filter UI, back/forward/reload state, Escape behavior, and no-result state.
- [ ] Port cards/details to shared tokens with text supplier attribution, 44px targets, image fallback, copy live region, and exact Zalo message.
- [ ] Preserve An Cường sample disclosure/noindex, Thanh Thuỳ routes/noindex, and Ba Thanh sitemap/indexability counts.

### Task 6: Verify catalogue locally and on preview

**Files:**
- Modify only for defects found by tests/audits.
- Update release documentation with final counts, gate results, preview URL, and blocker state.

**Interfaces:**
- Consumes: merged catalogue build
- Produces: reviewable Cloudflare Pages preview and evidence for every quality gate

- [ ] Run format check if configured, lint, typecheck, Vitest, build, internal-link, sitemap, canonical, JSON-LD, indexability, and secret scans.
- [ ] Run local Playwright and audit `1440x900`, `1280x800`, `768x1024`, `390x844`, `375x667`, and `360x800`.
- [ ] Push the branch/PR and deploy a Cloudflare Pages preview without `--prod`.
- [ ] Smoke test homepage, catalogue hub, An Cường, Thanh Thuỳ, Ba Thanh, and Melamine routes; verify console/network, copy, Zalo, ordering, URL state, and overflow.
- [ ] Run Lighthouse/accessibility gates and fix regressions before declaring the preview ready.

### Task 7: Enforce the catalogue production gate

**Files:**
- Update: release documentation only unless an implementation guard is needed.

**Interfaces:**
- Consumes: technical gate results and explicit media-right decision
- Produces: either a production catalogue release or a documented preview-only handoff

- [ ] If media rights remain `UNCONFIRMED`, do not merge/deploy catalogue production and report the preview URL as ready for review.
- [ ] If rights are explicitly authorized and every gate passes, merge the catalogue PR, deploy production, and smoke test all required routes.
- [ ] On catalogue production failure, roll back to `LANDING_RELEASE_SHA` without removing the stable landing release.
- [ ] Confirm the final working tree is clean and publish the requested `ROLLOUT` report.

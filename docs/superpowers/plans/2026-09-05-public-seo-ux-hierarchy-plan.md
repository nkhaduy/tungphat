# Public SEO and UX Hierarchy Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify Tùng Phát's public information hierarchy while preserving the existing catalogue-code SEO architecture and production invariants.

**Architecture:** Keep the current Next.js routes, metadata factory, catalogue classifier, and static sitemap. Refine shared navigation, homepage composition, footer, and brand presentation by consuming existing material, supplier-index, branch, and CMS data.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-05-public-seo-ux-hierarchy-design.md`

## Global Constraints

- Do not change catalogue exact-code canonical, robots, sitemap membership, or tier classification.
- Do not add unsupported supplier, stock, price, delivery, certification, review, rating, or Product Offer claims.
- Use Tùng Phát writing rules for all public Vietnamese copy.
- Keep catalogue-scale links `prefetch={false}`.
- Do not commit crawl dumps, secrets, `.env*`, screenshots, or generated temporary reports.

### Task 1: Regression contracts

**Files:**
- Modify: `tests/homepage-hero-layout.test.ts`
- Modify: `tests/performance-contract.test.ts`
- Modify: `e2e/site.spec.ts`
- Create: `tests/public-hierarchy.test.ts`

**Interfaces:**
- Tests inspect the shared source contracts and rendered public routes; they do not alter runtime data.

- [ ] **Step 1: Write failing assertions** for the approved hero labels, grouped navigation destinations, material/surface distinction, footer removal of third-party iframes, and An Cường catalogue availability.
- [ ] **Step 2: Run the focused Vitest tests** and confirm the new expectations fail against the pre-refinement source.
- [ ] **Step 3: Keep existing exact-code/robots/canonical tests** and add a 301 regression assertion if the current targeted suite lacks one.

### Task 2: Homepage hierarchy

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/HomeHero.tsx`
- Replace content structure in: `components/home/HomeContent.tsx`

**Interfaces:**
- Consume `getArticles`, `getPublicColorCodes`, `locations`, `homeGallery`, and existing route data.
- Preserve the `HomeContent` server-component boundary and existing analytics links.

- [ ] **Step 1:** Set homepage metadata/H1 to broad verified commercial intent without competing with dedicated material pages.
- [ ] **Step 2:** Render core material cards separately from surface/catalogue navigation.
- [ ] **Step 3:** Move catalogue discovery before CNC and remove duplicate proof/spec/gallery blocks.
- [ ] **Step 4:** Keep CNC, branches, compact knowledge, and one final Zalo CTA with consistent labels.
- [ ] **Step 5:** Run focused homepage tests and static typecheck.

### Task 3: Navigation and footer

**Files:**
- Modify: `components/site/SiteHeader.tsx`
- Modify: `components/site/MobileNavigation.tsx`
- Modify: `components/site/SiteFooter.tsx`

**Interfaces:**
- Reuse `NavigationItem`, `TrackedLink`, `ZALO_URL`, supplier route constants, and existing visual tokens.

- [ ] **Step 1:** Add controlled material and catalogue groups without a mega-menu.
- [ ] **Step 2:** Keep mobile groups keyboard accessible and close-on-navigation behavior intact.
- [ ] **Step 3:** Remove footer Maps/Facebook embeds while preserving NAP, branch links, legal links, and catalogue prefetch protection.
- [ ] **Step 4:** Run navigation, accessibility, and performance contract tests.

### Task 4: Brand/catalogue contradiction

**Files:**
- Modify: `components/BrandPage.tsx`
- Modify: `app/catalogue/[supplier]/page.tsx`
- Modify: `app/san-pham/[category]/page.tsx`

**Interfaces:**
- Consume `getSupplierSearchIndex` and existing supplier definitions; do not fabricate `brands.json` catalogue arrays.

- [ ] **Step 1:** Add a verified catalogue summary for brands with search-index records.
- [ ] **Step 2:** Replace misleading empty states with links to actual supplier/category catalogue routes.
- [ ] **Step 3:** Preserve noindex behavior for legacy presentation routes and indexability for canonical catalogue routes.
- [ ] **Step 4:** Run supplier output, catalogue, and brand route tests.

### Task 5: Full audit and delivery

**Files:**
- Create: `/tmp/tungphat-before-matrix.json`
- Create: `/tmp/tungphat-after-matrix.json`
- Do not commit generated reports.

- [ ] **Step 1:** Generate BEFORE and AFTER matrices for every sitemap URL.
- [ ] **Step 2:** Run `npm run verify`, `npm run lint`, `npm run build`, `npm run audit:production`, `npm run audit:media-cdn:production`, and legacy redirects.
- [ ] **Step 3:** Run Playwright desktop/mobile QA and the required user flows.
- [ ] **Step 4:** Review diff, remove unrelated generated changes, commit, push `origin/main`, deploy with the authorized Vercel project, and verify production HTML.

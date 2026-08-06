# Supplier Catalogue UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve supplier catalogue discovery, exact-code lookup, mobile usability, supplier clarity, and inquiry conversion while preserving all data, SEO, and media-right policies.

**Architecture:** Keep supplier adapters and static routes as the data source. Add small shared presentation helpers for supplier routes, human labels, URL-backed search state, and inquiry messages; update existing pages/components without a framework or routing migration.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Tailwind CSS, Vitest, Playwright, Axe.

## Global Constraints

- Work only in `/Users/khaduy/Downloads/tungphat-supplier-catalog-uiux` on `codex/catalog-suppliers-uiux-review`.
- Preserve the An Cuong `noindex` policy and media-right blocker.
- Do not add a UI dependency, change CMS/import pipelines, deploy, push, merge main, or mutate production.
- Do not claim price, stock, official distribution, or media rights.
- Use business configuration for phone and Zalo destinations.
- Write and run a failing test before every behavior change.

---

### Task 1: Preserve local browser rendering

**Files:**

- Modify: `lib/analytics/session.ts`
- Modify: `lib/analytics/client.ts`
- Test: `tests/analytics.test.ts`

**Interfaces:**

- Produces: `generateAnonymousId(): string`, safe with or without `crypto.randomUUID`.

- [x] Add a regression test that stubs crypto without `randomUUID` and expects deterministic UUID v4 values.
- [x] Run `npx vitest run tests/analytics.test.ts` and observe the original `TypeError` failure.
- [x] Add the `getRandomValues` fallback and reuse the helper for event IDs.
- [x] Re-run the focused test and production build.
- [ ] Commit with `fix(catalog): keep catalogue usable in non-secure local contexts` after the first documentation commit.

### Task 2: Record the customer audit and approved design

**Files:**

- Create: `docs/uiux/SUPPLIER_CATALOG_UIUX_AUDIT.md`
- Create: `docs/superpowers/specs/2026-08-05-supplier-catalog-uiux-design.md`
- Create: `docs/superpowers/plans/2026-08-05-supplier-catalog-uiux.md`

- [x] Document each issue with severity, route, device, persona, evidence, fix, and verification.
- [x] Document the task-first information architecture, conversion rules, responsive rules, and data guardrails.
- [ ] Self-review for placeholders, contradictions, and scope expansion.
- [ ] Commit with `docs(uiux): add supplier catalogue customer audit`.

### Task 3: Make supplier catalogue discovery canonical

**Files:**

- Modify: `components/Partners.tsx`
- Modify: `components/Header.tsx`
- Modify: `lib/catalog/core/navigation.ts`
- Test: `tests/supplier-navigation-sitemap.test.ts`
- Test: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**

- Consumes: existing `supplierNavigation` routes.
- Produces: homepage partner links and one customer-facing “Catalogue nha cung cap” navigation group.

- [ ] Add failing assertions for Thanh Thuy `/thuong-hieu/thanh-thuy/`, Ba Thanh `/ma-mau-melamine/ba-thanh/`, and An Cuong `/catalogue/an-cuong/` partner destinations.
- [ ] Add a failing mobile-menu test for menu body lock, supplier discovery, and close-on-navigation.
- [ ] Update partner destinations, visible labels, and the header/mobile information architecture.
- [ ] Run focused Vitest and Playwright tests.
- [ ] Commit with `fix(navigation): improve catalogue discovery`.

### Task 4: Make exact-code search keyboard-first and restorable

**Files:**

- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Create or modify: `lib/catalog/ui.ts`
- Test: `tests/supplier-catalog-core.test.ts`
- Test: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**

- Produces: `humanizeCatalogLabel(value: string): string` and URL parameters `q`, `supplier`, `category`.

- [ ] Add failing tests for humanized slugs and exact normalized code lookup.
- [ ] Add failing browser tests for `BT111`, `BT 111`, `bt-111`, Enter, Escape, filter URLs, and back restoration.
- [ ] Implement URL-backed state, exact Enter navigation, Escape clear, plain-language empty state, and intent-gated results.
- [ ] Verify keyboard and mobile interaction at 390x844 and 375x667.
- [ ] Commit with `fix(search): improve exact-code supplier search`.

### Task 5: Clarify hub, supplier cards, and detail hierarchy

**Files:**

- Modify: `app/catalogue/page.tsx`
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Modify: `components/thanh-thuy/ThanhThuyBrand.tsx`
- Modify: `components/thanh-thuy/ThanhThuyProductDetail.tsx`
- Modify: `components/catalog/ColorCodeCard.tsx`
- Modify: Ba Thanh detail route component discovered during implementation.
- Test: `e2e/supplier-catalogue.spec.ts`

- [ ] Add failing tests for supplier text, search-before-category order, and detail identity/action order.
- [ ] Add supplier entry cards and plain-language core-versus-surface guidance to the hub.
- [ ] Move Thanh Thuy search before category cards and strengthen supplier identity on details.
- [ ] Make all card supplier/type labels textual and preserve responsive image geometry.
- [ ] Commit with `fix(catalog): clarify supplier cards and details`.

### Task 6: Make An Cuong useful without blocked media

**Files:**

- Modify: `components/CatalogueView.tsx`
- Modify: `app/catalogue/[brand]/page.tsx`
- Modify: `lib/catalog/suppliers/an-cuong.ts` only if a presentation-safe accessor is required.
- Test: `tests/ancuong/sample.test.ts` or `tests/supplier-catalog-core.test.ts`
- Test: `e2e/supplier-catalogue.spec.ts`

- [ ] Add a failing test requiring all seven exported sample records on `/catalogue/an-cuong/`.
- [ ] Render text-first sample cards, data-scope explanation, trust note, and supplier-level inquiry.
- [ ] Verify no blocked media path is emitted and metadata remains `noindex,follow`.
- [ ] Include this change in `fix(catalog): clarify supplier cards and details`.

### Task 7: Standardize copy and inquiry actions

**Files:**

- Modify: `lib/catalog/import-utils.ts` or create `lib/catalog/inquiry.ts`
- Modify: `lib/thanh-thuy-seo.ts`
- Modify: `components/catalog/ColorCodeCard.tsx`
- Modify: Ba Thanh detail component.
- Modify: `components/thanh-thuy/ProductCodeActions.tsx`
- Modify: `components/catalog/ProductInquiryCTA.tsx`
- Test: `tests/ba-thanh-catalog.test.ts`
- Test: `tests/thanh-thuy-seo.test.ts`
- Test: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**

- Produces: `buildSupplierZaloInquiryUrl(baseUrl, supplierName, code?)` with the approved short templates.

- [ ] Add failing literal-message tests for coded and supplier-level inquiries.
- [ ] Add failing browser tests for unique copy accessible names, clipboard content, live announcement, and encoded Zalo URL.
- [ ] Implement the shared builder and contextual action groups near detail headings.
- [ ] Verify phone and quote links by `href` only.
- [ ] Commit with `fix(conversion): improve catalogue inquiry actions`.

### Task 8: Harden mobile and accessibility behavior

**Files:**

- Modify: `components/Header.tsx`
- Modify: catalogue component styles touched by prior tasks.
- Modify: `app/globals.css` only for shared focus/reduced-motion rules if necessary.
- Test: `e2e/supplier-catalogue.spec.ts`
- Test: existing accessibility specs.

- [ ] Add failing coverage for mobile menu body lock, focus behavior, 44px targets, and no horizontal overflow.
- [ ] Implement only the minimum behavior/style changes needed for the failures.
- [ ] Verify 200% zoom, reduced motion, mobile rotation, and keyboard-only flows.
- [ ] Commit behavior under `fix(mobile): improve catalogue mobile interactions` and accessibility under `fix(a11y): improve catalogue keyboard and screen-reader UX` when separable.

### Task 9: Verify performance and customer journeys

**Files:**

- Create: `docs/uiux/catalogue/after/*.png`
- Create: `docs/uiux/SUPPLIER_CATALOG_CUSTOMER_JOURNEYS.md`
- Create: `docs/uiux/SUPPLIER_CATALOG_VISUAL_SYSTEM.md`
- Create: `docs/uiux/SUPPLIER_CATALOG_UIUX_FINAL_REPORT.md`
- Modify: `docs/seo/SUPPLIER_CATALOG_INTEGRATION_RUNBOOK.md`

- [ ] Build and serve the production export locally.
- [ ] Complete personas A-F and all requested representative viewport interactions.
- [ ] Capture the ten representative after screenshots without retaining noisy artifacts.
- [ ] Run Lighthouse for Thanh Thuy, Ba Thanh, and An Cuong and compare with baseline.
- [ ] Document journey friction, fixes, visual rules, performance, limitations, and media-right blocker.
- [ ] Commit tests with `test(catalog): add supplier customer journey coverage` and final docs with `docs(uiux): add final catalogue UX report`.

### Task 10: Run final quality gates and finish the branch

- [ ] Run Prettier check/write only on touched source and documentation files.
- [ ] Run full lint, typecheck, Vitest, Playwright/Axe, production build, route/link/canonical/sitemap/JSON-LD audits, Lighthouse, and secret/conflict/debug scan.
- [ ] Confirm no duplicate sitemap URL, orphan indexable page, broken link, invalid JSON-LD, temporary artifact, or public deployment mutation.
- [ ] Review `git diff --check`, `git status --short`, and the commit list.
- [ ] Commit any final documentation-only adjustments, then confirm a clean working tree.

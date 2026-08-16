# Catalogue Infinite Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make public Mã màu lists auto-load the next local page near the viewport bottom with an accessible loading animation, while filter controls wrap without horizontal scrolling.

**Architecture:** Add a small client-only `AutoLoadMore` component that owns `IntersectionObserver`, loading guard, minimum visual delay, reduced-motion skeletons, and a manual fallback button. Each catalogue search component supplies its visible-count state and reset behavior; the existing search/index data remains unchanged. All filter rows use `flex-wrap` and normal button sizing.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Playwright.

## Global Constraints

- Preserve supplier priority Thanh Thuỳ → Ba Thanh → An Cường and exact code/search behavior.
- Do not change catalogue records, media provenance, rights status, ordering, or SEO policy.
- Never introduce horizontal scrolling in search/filter controls at mobile widths.
- Keep a manual accessible fallback when `IntersectionObserver` is unavailable.
- Respect `prefers-reduced-motion` and expose loading state with `aria-live="polite"`.

---

### Task 1: Add the reusable auto-load primitive

**Files:**
- Create: `components/catalog/shared/AutoLoadMore.tsx`
- Test: `tests/catalogue-auto-load-more.test.tsx`

**Interfaces:**
- Produces `AutoLoadMore({ hasMore, onLoadMore, remaining, pageSize, label? })`.
- Renders a `data-testid="catalogue-load-sentinel"`, an accessible loading status, three skeleton blocks while loading, and a manual fallback button.

- [ ] **Step 1: Write failing tests** for the sentinel, `aria-live` status, skeleton semantics, observer-triggered callback, and no callback after `hasMore` becomes false.
- [ ] **Step 2: Run `npx vitest run tests/catalogue-auto-load-more.test.tsx`** and verify the new tests fail because the component does not exist.
- [ ] **Step 3: Implement the component** with `IntersectionObserver` and `rootMargin: "700px 0px"`; guard duplicate callbacks with a ref; delay the callback by 300ms (150ms with reduced motion); cancel timers on unmount; expose a visible fallback button only when observer support is missing and a focusable `sr-only` fallback otherwise.
- [ ] **Step 4: Run the focused Vitest file** and verify it passes.
- [ ] **Step 5: Commit** `feat: add catalogue auto-load primitive`.

### Task 2: Wire supplier and Ba Thanh lists to auto-loading

**Files:**
- Modify: `components/catalog/AnCuongCatalogueSearch.tsx`
- Modify: `components/catalog/ColorCodeSearch.tsx`
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Test: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Consume `AutoLoadMore` from Task 1.
- Supplier list components keep their current page sizes (`48`, `36`, and `48` respectively) and pass their existing result lengths/visible counts to the primitive.

- [ ] **Step 1: Add failing Playwright coverage** asserting An Cường and Ba Thanh lists grow after the sentinel enters view, loading status appears, and the manual button is not required; assert the hub search results also grow when a broad query is entered.
- [ ] **Step 2: Run the focused Playwright tests** against the existing preview/local config and verify the new assertions fail with only the initial page visible.
- [ ] **Step 3: Add `visibleLimit`/page state and reset it** whenever deferred query, material/category, supplier, type, or group changes; render `AutoLoadMore` after result grids and call the existing state increment as the load callback.
- [ ] **Step 4: Run the focused Playwright tests** and verify automatic loading plus exact-code search still pass.
- [ ] **Step 5: Commit** `feat: auto-load catalogue code pages`.

### Task 3: Remove horizontal filter scrolling

**Files:**
- Modify: `components/catalog/AnCuongCatalogueSearch.tsx`
- Modify: `components/catalog/ColorCodeSearch.tsx`
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Test: `e2e/supplier-catalogue.spec.ts`

- [ ] **Step 1: Add failing mobile assertions** that every filter group has `scrollWidth <= clientWidth` and the document has no horizontal overflow at 390px.
- [ ] **Step 2: Run the focused mobile test** and verify it fails because the rows currently use `overflow-x-auto`.
- [ ] **Step 3: Replace overflow/snap/shrink styles** with `flex flex-wrap`, `min-w-0`, and responsive button widths/padding so long labels wrap naturally without clipping.
- [ ] **Step 4: Run the mobile test** and verify it passes with reduced-motion mode.
- [ ] **Step 5: Commit** `fix: wrap catalogue filters on mobile`.

### Task 4: Full verification and production promotion

**Files:**
- Modify: `docs/superpowers/specs/2026-08-08-catalogue-infinite-loading-design.md` only if acceptance notes need evidence.
- Modify: `docs/superpowers/plans/2026-08-08-catalogue-infinite-loading.md` to check completed steps.

- [ ] **Step 1: Run** `npm run lint`, `npm run typecheck`, `npm test`, focused and full `npm run test:e2e`, and `npm run build`.
- [ ] **Step 2: Inspect desktop 1440x900 and mobile 390x844** on `/catalogue/`, supplier hubs, and a filtered supplier page; confirm skeletons, image cards, no blank image src, and no horizontal overflow.
- [ ] **Step 3: Push** `codex/catalog-color-code-media-audit` and wait for the Vercel preview deployment.
- [ ] **Step 4: Promote the verified deployment** to `mdftungphat.com` only after smoke-testing `/catalogue/`, `/catalogue/an-cuong/`, `/catalogue/ba-thanh/`, and `/catalogue/thanh-thuy/`.
- [ ] **Step 5: Record** deployment URL, checks, and any pre-existing `npm audit` advisory in the final report; do not merge to main.

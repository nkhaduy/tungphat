# Remove Floating Catalogue Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the scroll-triggered floating catalogue search while preserving all original search and filter behavior.

**Architecture:** `SupplierCatalogSearch` remains the single owner of catalogue query and filter state. Delete the view-only observer, focus-transfer state, and duplicate fixed controls so scrolling has no effect on the search UI.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Playwright.

## Global Constraints

- Preserve the existing catalogue search, filter, URL, exact-code, and result behavior.
- Render exactly one catalogue search box on desktop and mobile.
- Do not change unrelated catalogue card or content behavior.
- Verify the deployed result directly on `https://mdftungphat.com`.

---

### Task 1: Lock the non-floating behavior

**Files:**
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Consumes: catalogue page search box with accessible name `Nhập mã màu, tên màu hoặc thương hiệu...`.
- Produces: regression coverage proving scroll does not duplicate or disable the original search.

- [ ] **Step 1: Replace the floating-search test with the expected behavior**

Add a test that loads `/catalogue/` at desktop size, enters a query, scrolls down, and asserts that only one matching searchbox exists and `catalogue-search-original` has no `inert` attribute.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx playwright test e2e/supplier-catalogue.spec.ts --grep "keeps one search" --reporter=list`

Expected: FAIL because the current implementation creates a second fixed search and makes the original inert.

### Task 2: Remove the floating implementation

**Files:**
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing query/filter state and handlers inside `SupplierCatalogSearch`.
- Produces: one in-flow catalogue search interface with unchanged query/filter behavior.

- [ ] **Step 1: Delete floating-only React code**

Remove `useRef`, `isFloating`, `floatingFiltersOpen`, observer setup, focus transfer, floating refs, conditional `aria-hidden`/`inert` on the original controls, and the fixed duplicate controls.

- [ ] **Step 2: Delete floating-only CSS**

Remove the `.catalogue-floating-controls` desktop positioning rule.

- [ ] **Step 3: Run the focused browser test and verify it passes**

Run: `npx playwright test e2e/supplier-catalogue.spec.ts --grep "keeps one search" --reporter=list`

Expected: PASS.

### Task 3: Verify and deliver

**Files:**
- Verify only: repository test and build configuration.

**Interfaces:**
- Consumes: completed source and regression test changes.
- Produces: tested and production-verified deployment.

- [ ] **Step 1: Run catalogue tests, lint, and typecheck**

Run: `npm test -- catalogue && npm run lint && npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit 0 with static output checks passing.

- [ ] **Step 3: Run relevant catalogue E2E tests**

Run: `npx playwright test e2e/supplier-catalogue.spec.ts --reporter=list`

Expected: all tests pass.

- [ ] **Step 4: Commit, push, and deploy using the repository workflow**

Commit only the floating-search fix, its regression test, and documentation. Push the current branch and wait for the production deployment to become ready.

- [ ] **Step 5: Verify production desktop and mobile**

Open `https://mdftungphat.com/catalogue/`, scroll past the original controls at desktop and mobile sizes, and confirm there is one search interface with no console errors or failed network requests.

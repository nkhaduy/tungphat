# Material Catalogue Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium, responsive `/catalogue/` redesign without changing catalogue data, search ranking, URL behavior, SEO routes, or progressive loading.

**Architecture:** Keep `app/catalogue/page.tsx` as the static server-rendered page and retain `SupplierCatalogSearch` as the client interaction boundary. Refactor only the component markup/classes and catalogue-specific CSS, with Playwright coverage around observable behavior and accessibility.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Lucide React, Vitest, Playwright.

## Global Constraints

- Production source of truth is `https://mdftungphat.com`.
- Preserve all catalogue data, canonical routes, metadata, static HTML fallback, ranking, URL state, and 48-item progressive loading.
- Add no new runtime dependency, font download, image asset, sort control, or grid/list toggle.
- Limit visual changes to `/catalogue/` and shared tokens/classes that do not alter unrelated pages.

---

### Task 1: Lock Observable Catalogue UX

**Files:**
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Consumes: the public `/catalogue/` DOM and existing catalogue data.
- Produces: regression coverage for the new accessible search label, result copy, filters, feedback, and responsive layout.

- [ ] Add expectations for searchbox name `Nhập mã màu, tên màu hoặc thương hiệu...`, `Kết quả phù hợp`, dynamic `mã màu` count, filter pressed states, supplier selection, copy feedback, and empty results.
- [ ] Run `npx playwright test e2e/supplier-catalogue.spec.ts --reporter=list` and confirm the new expectations fail against the current UI for the intended reasons.
- [ ] Keep existing exact-code navigation, no-JavaScript, auto-load, canonical route, and mobile-overflow assertions unchanged.

### Task 2: Implement Premium Hero, Filters, Results, And Cards

**Files:**
- Modify: `app/catalogue/page.tsx`
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `CatalogSearchEntry[]`, existing search/filter helpers, supplier registry, URL-state functions, and `AutoLoadMore`.
- Produces: the same public behavior through upgraded semantic markup and catalogue-specific presentation.

- [ ] Move the search visually into the compact hero and add a CSS-only material-panel motif that is hidden from assistive technology.
- [ ] Update the search label/placeholder and preserve Enter/Escape behavior, deferred filtering, and URL updates.
- [ ] Render chip labels and counts as separate spans while retaining `aria-pressed`, current taxonomy counts, and supplier-directory selection.
- [ ] Style the native select with a visible label and put the ranking copy inside a low-emphasis info note.
- [ ] Change the full/filtered result summary to `Kết quả phù hợp` and locale-formatted `${results.length} mã màu`.
- [ ] Rebuild cards around larger swatches, restrained radius/elevation, stable content height, secondary copy and primary detail actions, correct image `sizes`, and pointer-only hover lift.
- [ ] Keep the 48-item slice and `AutoLoadMore` unchanged; use catalogue-specific `content-visibility` only when safe.
- [ ] Run the focused Playwright test and make all Task 1 assertions pass.

### Task 3: Verify, Deploy, And Production-QA

**Files:**
- Modify only if a regression is found in the files above or their focused tests.

**Interfaces:**
- Consumes: the completed code and repository deployment workflow.
- Produces: a production deployment verified at all requested viewports.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate:links`, `npm run test:e2e`, and `git diff --check`; fix regressions and rerun failed gates.
- [ ] Serve the production export and visually inspect 1440×900, 1280×800, 768×1024, and 390×844, including search, material filter, supplier filter, empty state, copy, detail navigation, header, footer, console, and failed requests.
- [ ] Commit the focused change, synchronize with current `origin/main`, fast-forward `main`, and push without force.
- [ ] Wait for Vercel production deployment, hard-refresh `https://mdftungphat.com/catalogue/`, repeat the core interactions and responsive screenshots, and inspect console/network before reporting PASS.

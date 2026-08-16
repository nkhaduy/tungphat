# Catalogue Card Copy Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize public catalogue card copy so each card shows one concise supplier-specific title and one deduplicated `Danh mục:` line.

**Architecture:** Add pure presentation helpers to `lib/catalog/ui.ts`, then consume them from both shared catalogue card implementations and the legacy Ba Thanh card. Raw codes, names, search data, routes, and copy actions remain unchanged.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Playwright, Tailwind CSS.

## Global Constraints

- Card eyebrow shows only the supplier name; remove customer-facing `Mã màu` next to it.
- Render one primary title and no separate code-only row.
- Preserve `301 Artistic Stripe` as the single title.
- Strip `MELAMINE BA THANH –` and `LAMINATE BA THANH –` from Ba Thanh card titles.
- Render `Danh mục: Melamine · Vân Gỗ` and deduplicate normalized taxonomy labels.
- Do not mutate raw records, copy-code values, search ranking, routes, detail H1s, media, or supplier ordering.

---

### Task 1: Add tested card presentation helpers

**Files:**
- Modify: `lib/catalog/ui.ts`
- Create: `tests/catalogue-card-copy.test.ts`

**Interfaces:**
- Produce `formatCatalogCardTitle(entry: Pick<CatalogSearchEntry, "supplierId" | "code" | "name">): string`.
- Produce `formatCatalogCardTaxonomy(entry: Pick<CatalogSearchEntry, "category" | "series" | "group" | "material">): string`.

- [ ] **Step 1: Write failing helper tests** asserting `301 Artistic Stripe`, Ba Thanh prefix removal, and `Danh mục: Melamine · Vân Gỗ` deduplication.
- [ ] **Step 2: Run `npx vitest run tests/catalogue-card-copy.test.ts`** and verify failure because the helper exports do not exist.
- [ ] **Step 3: Implement minimal pure helpers** using `normalizeCatalogSearch` for code detection and taxonomy deduplication; title-case the first taxonomy character without changing the remaining source label.
- [ ] **Step 4: Re-run the focused Vitest file** and verify all helper cases pass.

### Task 2: Apply normalized copy across card views

**Files:**
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Modify: `components/catalog/AnCuongCatalogueSearch.tsx`
- Modify: `components/catalog/ColorCodeCard.tsx`
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Consume `formatCatalogCardTitle` and `formatCatalogCardTaxonomy` from Task 1.
- Continue passing the original `entry.code` to clipboard handlers and accessibility labels.

- [ ] **Step 1: Add failing Playwright assertions** for a filtered Thanh Thuỳ `301` card and a Ba Thanh `BT111` card: no standalone code line, no `Mã màu` eyebrow, no repeated `Vân Gỗ`, and no Ba Thanh material prefix.
- [ ] **Step 2: Run the focused Playwright assertions against the current deployment** and verify the existing card markup fails.
- [ ] **Step 3: Replace card copy markup** with supplier-only eyebrow, one helper-formatted title, and one helper-formatted taxonomy line while preserving link and copy behavior.
- [ ] **Step 4: Run lint, typecheck, focused Vitest, and the focused Playwright tests** and verify all pass.
- [ ] **Step 5: Commit and push** `fix(catalogue): normalize card copy`.

### Task 3: Deploy and verify production

**Files:**
- No source changes expected.

- [ ] **Step 1: Wait for the Git-triggered Vercel deployment** for the new commit to reach `READY`.
- [ ] **Step 2: Assign** `mdftungphat.com`, `www.mdftungphat.com`, and `tungphat.vercel.app` to that deployment.
- [ ] **Step 3: Run the focused Playwright tests against `https://mdftungphat.com`** and verify Thanh Thuỳ and Ba Thanh card copy.
- [ ] **Step 4: Smoke `/catalogue/` for HTTP 200** and confirm the worktree is clean.

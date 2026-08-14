# Supplier Taxonomy Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose all imported supplier records, including Thanh Thuỳ edge-band families, through a shared canonical taxonomy with nested material groups.

**Architecture:** Extend the existing compact public color-code index with only the non-code product/family records needed for complete supplier coverage. Normalize source pattern labels into a separate canonical group field, then add a second filter row that is scoped by the selected material and supplier while preserving original series/group labels on cards.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-13-supplier-taxonomy-merge-design.md`

## Global Constraints

- Preserve unrelated working-tree changes.
- Do not alter source URLs, supplier identity, or media rights metadata.
- Unknown material labels remain visible under `other-decorative`; unknown pattern labels simply have no canonical subgroup.
- Family records are searchable but do not become indexable color-code detail pages.
- Existing color-code detail routes and supplier counts remain semantically distinct from total searchable catalogue records.
- Use ASCII for identifiers and new source text; existing Vietnamese customer copy may use Unicode.

---

### Task 1: Canonical Pattern Taxonomy

**Files:**
- Modify: `lib/catalog/material-taxonomy.ts`
- Modify: `lib/catalog/core/types.ts`
- Test: `tests/supplier-catalog-core.test.ts`

**Interfaces:**
- Produces: `CanonicalCatalogGroup`, `canonicalCatalogGroups`, `classifyCatalogGroup(values)`, and `catalogGroupOptions(entries, filters)`.
- Extends: `CatalogSearchEntry` with `canonicalGroup?: CanonicalCatalogGroup` and `sourceGroup?: string`.

- [ ] **Step 1: Write failing classification and counting tests**

Add assertions that `Vân Gỗ`, `van-go`, and `Woodgrain` map to `woodgrain`; solid labels map to `solid`; stone/material and textile labels stay distinct; unknown labels return `undefined`; and supplier/material-scoped group counts exclude unrelated records.

- [ ] **Step 2: Run the focused test**

Run: `npx vitest run tests/supplier-catalog-core.test.ts`

Expected: FAIL because the canonical group exports and fields do not exist.

- [ ] **Step 3: Implement the taxonomy API**

Add a stable ordered group list with customer labels, folded-string matching, and a count helper that accepts optional `supplierId` and `material` filters.

- [ ] **Step 4: Re-run the focused test**

Run: `npx vitest run tests/supplier-catalog-core.test.ts`

Expected: PASS.

### Task 2: Expand the Shared Search Index

**Files:**
- Modify: `scripts/catalog-suppliers/build-search-index.ts`
- Modify: `lib/catalog/suppliers/search-index.ts`
- Generate: `data/catalogs/supplier-search-index.json`
- Test: `tests/full-catalogue-search-index.test.ts`

**Interfaces:**
- Consumes: canonical group classification from Task 1.
- Produces: the existing public color-code records plus unique non-code `family` records from the full supplier import.
- Preserves: `getSupplierTotals()` color-code counts used in supplier cards.

- [ ] **Step 1: Write the failing edge-family regression test**

Assert that the shared index contains five Thanh Thuỳ `edge-banding` family records, that the three woodgrain families use `canonicalGroup: "woodgrain"`, and that all five link to `/san-pham/chi-nep-nhua/`.

- [ ] **Step 2: Run the focused test**

Run: `npx vitest run tests/full-catalogue-search-index.test.ts`

Expected: FAIL because `getSupplierSearchIndex()` currently exposes color codes only.

- [ ] **Step 3: Add canonical fields to the generated full index**

Populate `sourceGroup` from the source record, calculate `canonicalGroup`, and keep the current duplicate-ID guard in `buildSupplierSearchIndex()`.

- [ ] **Step 4: Merge non-code families into the runtime compact index**

Import the generated full index artifact in `lib/catalog/suppliers/search-index.ts`, append records whose `recordType === "family"`, and reject IDs or canonical routes that collide with an existing public color-code record. Keep `getSupplierTotals()` based on color codes, and expose a separate searchable-record total only if UI copy needs it.

- [ ] **Step 5: Rebuild and verify the artifact**

Run: `npm run catalog:suppliers:search-index`

Run: `npx vitest run tests/full-catalogue-search-index.test.ts tests/supplier-catalog-core.test.ts`

Expected: PASS with five Thanh Thuỳ edge families present and existing color-code totals unchanged.

### Task 3: Canonical Group Search and URL State

**Files:**
- Modify: `lib/catalog/core/search.ts`
- Modify: `lib/catalog/url-state.ts`
- Test: `tests/supplier-catalog-core.test.ts`
- Test: `tests/catalog-url-state.test.ts`

**Interfaces:**
- Extends: search options with `canonicalGroup?: CanonicalCatalogGroup`.
- Changes: `getCatalogSearchOptionsForSelection(material, canonicalGroup, type)` to return independent material and canonical group filters.
- URL contract: material remains `group=<material>` for compatibility and subgroup uses `pattern=<canonical-group>`.

- [ ] **Step 1: Write failing search and URL tests**

Cover Melamine plus `woodgrain`, edge-banding plus Thanh Thuỳ, legacy `group=van-go`, new `group=melamine&pattern=woodgrain`, and invalid pattern removal.

- [ ] **Step 2: Run the focused tests**

Run: `npx vitest run tests/supplier-catalog-core.test.ts tests/catalog-url-state.test.ts`

Expected: FAIL because material and pattern are currently stored in one field.

- [ ] **Step 3: Implement independent material/pattern filters**

Filter by `entry.material` and `entry.canonicalGroup` without removing source category, series, or group text from free-text ranking.

- [ ] **Step 4: Preserve compatible URL parsing**

Parse old pattern slugs from `group` as canonical patterns, parse new `pattern`, serialize materials in `group`, and serialize canonical subgroups in `pattern`.

- [ ] **Step 5: Re-run the focused tests**

Run: `npx vitest run tests/supplier-catalog-core.test.ts tests/catalog-url-state.test.ts`

Expected: PASS.

### Task 4: Hierarchical Catalogue Controls

**Files:**
- Modify: `components/catalog/shared/SupplierCatalogSearch.tsx`
- Modify: `lib/catalog/ui.ts`
- Test: `tests/catalogue-hub-layout.test.ts`
- Test: `tests/catalogue-card-copy.test.ts`

**Interfaces:**
- Consumes: `catalogGroupOptions()` and independent material/pattern search state.
- Produces: a second control row labeled `Kiểu vân / màu` only when the selected material has canonical groups.

- [ ] **Step 1: Write failing static-render tests**

Assert that the subgroup control is present, contains `Vân gỗ` and `Đơn sắc`, and that family-card result copy uses `sản phẩm` rather than counting every result as a color code.

- [ ] **Step 2: Run the focused tests**

Run: `npx vitest run tests/catalogue-hub-layout.test.ts tests/catalogue-card-copy.test.ts`

Expected: FAIL because no second row exists.

- [ ] **Step 3: Implement subgroup selection**

Reset the subgroup when material or supplier changes and the selected subgroup is unavailable. Keep mobile horizontal scrolling and existing button styling.

- [ ] **Step 4: Adjust result and taxonomy copy**

Use `sản phẩm` for mixed/family result counts while retaining `mã màu` on supplier cards. Prefer canonical group labels on cards, then preserve useful source collection/series labels without duplicates.

- [ ] **Step 5: Re-run the focused tests**

Run: `npx vitest run tests/catalogue-hub-layout.test.ts tests/catalogue-card-copy.test.ts`

Expected: PASS.

### Task 5: Browser Regression Coverage

**Files:**
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Verifies: production-equivalent behavior for edge families and nested Melamine groups.

- [ ] **Step 1: Add failing E2E assertions**

Add a test that selects Thanh Thuỳ and `Mã cạnh`, sees all five family cards, then selects Melamine and `Vân gỗ` and confirms only matching records remain.

- [ ] **Step 2: Build and run the targeted E2E test**

Run: `npm run build`

Run: `npx playwright test e2e/supplier-catalogue.spec.ts --reporter=list`

Expected: PASS after Tasks 1-4; investigate and fix any regression before continuing.

### Task 6: Full Verification and Production Delivery

**Files:**
- Generated reports only when changed by required quality commands.

**Interfaces:**
- Produces: a deployable main-branch commit and verified production behavior.

- [ ] **Step 1: Run local quality gates**

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Run: `npm run validate:links`

Run: `git diff --check`

- [ ] **Step 2: Run relevant E2E coverage**

Run: `npx playwright test e2e/supplier-catalogue.spec.ts e2e/thanh-thuy.spec.ts --reporter=list`

- [ ] **Step 3: Commit and push intended changes**

Stage only implementation, tests, generated catalogue artifact, spec, and plan. Do not stage `.DS_Store`, pre-existing report changes, `.playwright-cli/`, `output/`, or `payload-cms/` unless they are directly required.

- [ ] **Step 4: Wait for deployment readiness**

Use the repository's Vercel Git integration and verify the production deployment associated with the pushed commit is ready.

- [ ] **Step 5: Verify production desktop and mobile**

Open `https://mdftungphat.com/catalogue/?supplier=thanh-thuy&group=edge-banding` and confirm the five Thanh Thuỳ edge families. Open Melamine, select `Vân gỗ`, and confirm the subgroup filter, URL state, result cards, console, and network requests on desktop and mobile.

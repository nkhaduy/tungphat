# Ba Thanh Melamine Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rerunnable Ba Thanh Melamine import pipeline and an SEO-safe static catalogue with local media, search, filters and inquiry CTAs.

**Architecture:** A Ba Thanh source adapter produces a deterministic supplier-agnostic catalogue dataset. Next.js reads the dataset at build time and statically renders collection/category/code routes while a small client island handles interactive search and filters.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node fetch, Sharp, Zod, Vitest, Playwright, static export.

## Global Constraints

- Do not deploy or mutate production.
- Do not hotlink source media or render raw source HTML.
- Do not overwrite unrelated working-tree changes.
- Do not claim authorization, stock, price, availability or unsupported technical performance.
- Keep source and editorial fields separate.
- Only `READY_TO_INDEX` records enter sitemap output.
- Preserve trailing-slash canonicals.

---

### Task 1: Catalogue Types and Normalization

**Files:**
- Create: `lib/catalog/types.ts`
- Create: `lib/catalog/normalize-code.ts`
- Test: `tests/ba-thanh-normalize.test.ts`

**Interfaces:**
- Produces: `normalizeSupplierCode(raw: string): NormalizedCodeResult`, `SupplierColorCode`, `CatalogCategory`.

- [ ] Write failing tests for `BT111`, `BT 111`, `BT-111`, `Ba Thanh BT 111`, `SC020M`, and ambiguity preservation.
- [ ] Run `npx vitest run tests/ba-thanh-normalize.test.ts` and confirm failure because the module is absent.
- [ ] Implement conservative uppercase normalization that retains suffixes and raw values.
- [ ] Run the focused test and confirm pass.
- [ ] Commit with `feat(catalog): normalize Ba Thanh color codes`.

### Task 2: Source Discovery and Crawl

**Files:**
- Create: `scripts/ba-thanh/config.ts`
- Create: `scripts/ba-thanh/http.ts`
- Create: `scripts/ba-thanh/extract.ts`
- Create: `scripts/ba-thanh/discover.ts`
- Create: `scripts/ba-thanh/crawl.ts`
- Create: `scripts/ba-thanh/types.ts`
- Test: `tests/ba-thanh-extract.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `normalizeSupplierCode`.
- Produces: `discoverIndex(html, indexUrl)`, `crawlDetails(manifest)`, npm discovery/crawl commands.

- [ ] Write fixtures/tests that prove only links inside catalogue category panels are accepted.
- [ ] Verify the tests fail before implementation.
- [ ] Implement robots check, transparent user-agent, timeout, retry/backoff, concurrency limit, cache/resume and same-domain redirect validation.
- [ ] Implement DOM-marker extraction without prefix assumptions and detail-page recognition by source relationship plus matching heading/code.
- [ ] Run discovery and detail crawl to create `source-manifest.json` and `discovered-codes.json`.
- [ ] Re-run discovery to prove deterministic output apart from crawl timestamps.
- [ ] Commit with `feat(catalog): add Ba Thanh Melamine discovery pipeline`.

### Task 3: Media and Import

**Files:**
- Create: `scripts/ba-thanh/download-media.ts`
- Create: `scripts/ba-thanh/import.ts`
- Create: `scripts/ba-thanh/validate.ts`
- Create: `scripts/ba-thanh/duplication-audit.ts`
- Create: `data/imports/ba-thanh/*.json`
- Create: `public/catalog/ba-thanh/*`
- Modify: `.gitignore`
- Test: `tests/ba-thanh-import.test.ts`

**Interfaces:**
- Produces: deterministic `catalog.json`, `import-report.json`, `validation-report.json` and duplication metrics.

- [ ] Write failing tests for image MIME rejection, checksum deduplication, dry-run and second-import idempotency.
- [ ] Verify focused tests fail.
- [ ] Implement Sharp validation and high-quality WebP output with no upscaling or color transforms.
- [ ] Implement merge semantics that preserve editorial fields and last valid published data.
- [ ] Run dry-run, real import and a second import; require Created 0 and Unexpected updates 0 on the second pass.
- [ ] Run validation and duplication audit.
- [ ] Commit with `feat(catalog): import Ba Thanh catalogue media`.

### Task 4: Static Catalogue Repository and Pages

**Files:**
- Create: `lib/catalog/ba-thanh.ts`
- Create: `components/catalog/*`
- Create: `app/thuong-hieu/ba-thanh/page.tsx`
- Create: `app/ma-mau-melamine/ba-thanh/page.tsx`
- Create: `app/ma-mau-melamine/ba-thanh/[category]/page.tsx`
- Create: `app/ma-mau-melamine/ba-thanh/[code]/page.tsx`
- Test: `tests/ba-thanh-catalog.test.ts`

**Interfaces:**
- Consumes: imported `catalog.json`.
- Produces: server selectors and static route params; client `ColorCodeSearch` receives a lightweight serializable index.

- [ ] Write failing selector/route-policy tests for category counts, indexable/noindex codes and related-code selection.
- [ ] Verify focused tests fail.
- [ ] Implement brand, hub, category and detail pages with original copy, breadcrumbs, disclaimers, locations and service links.
- [ ] Implement accessible search/filter/pagination/copy/broken-image states without hiding server-rendered links.
- [ ] Verify sample BT and SC routes plus mobile/desktop behavior.
- [ ] Commit page work with `feat(catalog): add Ba Thanh color-code pages` and interaction work with `feat(search): add Melamine code search and filters`.

### Task 5: SEO, Sitemap and Crawl Controls

**Files:**
- Create: `lib/catalog/seo.ts`
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`
- Modify contextual link files only when they do not overlap unrelated edits.
- Test: `tests/ba-thanh-seo.test.ts`

**Interfaces:**
- Produces: unique metadata, CollectionPage/ItemList/Product/Breadcrumb JSON-LD and sitemap entries.

- [ ] Write failing tests for unique title/meta, self canonical, no Offer, sitemap eligibility and no query URLs.
- [ ] Verify focused tests fail.
- [ ] Implement visible-data-matched JSON-LD and canonical/noindex rules.
- [ ] Add only stable canonical catalogue URLs to sitemap.
- [ ] Add robots query-pattern controls without blocking catalogue assets.
- [ ] Commit with `feat(seo): add Ba Thanh catalogue metadata and schema`.

### Task 6: Documentation and Verification

**Files:**
- Create: `docs/seo/BA_THANH_IMPORT_REPORT.md`
- Create: `docs/seo/BA_THANH_DUPLICATION_AUDIT.md`
- Create: `docs/seo/BA_THANH_MELAMINE_RUNBOOK.md`
- Create: `docs/seo/BA_THANH_MELAMINE_FINAL_REPORT.md`
- Create: `docs/seo/SUPPLIER_CATALOG_MERGE_NOTES.md`
- Modify: test/e2e files as needed.

**Interfaces:**
- Consumes: generated reports and build output.
- Produces: operational handoff and evidence-backed completion report.

- [ ] Run format check, scoped lint, scoped typecheck, unit/integration tests, import validation, second import, build and static-output checks.
- [ ] Run Playwright smoke/accessibility checks on hub, two categories, one BT code and one SC code at desktop/mobile widths.
- [ ] Run Lighthouse or equivalent local performance audit and secret/dependency checks.
- [ ] Record exact counts, failures and known limitations; do not convert pre-existing failures into feature claims.
- [ ] Confirm no production command or deployment occurred.
- [ ] Commit with `test(catalog): validate Ba Thanh import and routes` and `docs(catalog): add Ba Thanh catalogue runbook`.

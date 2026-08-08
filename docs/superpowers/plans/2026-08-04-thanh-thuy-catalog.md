# Thanh Thuy Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the public Thanh Thuy catalogue into an original, searchable Tùng Phát catalogue with safe SEO indexing and local optimized media.

**Architecture:** Keep the existing Next.js static export and repository-backed CMS. Normalize cached public source data into `data/catalogs/thanh-thuy/catalog.json`, expose it through dedicated brand/category/product routes, and keep only quality-approved product records indexable.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod, Node ESM scripts, Sharp, Vitest, Playwright, existing Tailwind/CSS tokens.

## Global Constraints

- Do not overwrite unrelated working-tree changes; all work occurs in linked worktree branch `codex/catalog-thanh-thuy-seo`.
- Do not clone supplier UI or copy long marketing text; retain `sourceUrl`, `sourceName: "Gỗ Thanh Thuỳ"`, `supplier: "Thanh Thuỳ"`, import date, and checksum.
- Crawl only public catalogue data under the supplier's `/products/` scope plus public product/taxonomy API records required to represent that scope; respect robots, low concurrency, retry backoff, cache, and no bypass.
- Never hotlink supplier images, invent price/stock/certification, or emit numeric zero-price offers.
- Keep `trailingSlash: true`, canonical origin `https://mdftungphat.com`, and current business contact config.
- Index only `READY_TO_INDEX` records; filter/search URLs remain non-indexable or client-side state.

### Task 1: Data contract and source pipeline

**Files:**
- Create: `scripts/thanh-thuy/types.ts`, `scripts/thanh-thuy/discover.ts`, `scripts/thanh-thuy/crawl.ts`, `scripts/thanh-thuy/normalize.ts`, `scripts/thanh-thuy/import.ts`, `scripts/thanh-thuy/validate.ts`, `scripts/thanh-thuy/lib.ts`
- Create: `data/imports/thanh-thuy/source-manifest.json`, `data/imports/thanh-thuy/import-report.json`, `data/catalogs/thanh-thuy/catalog.json`
- Modify: `package.json`, `.gitignore`
- Test: `tests/thanh-thuy-pipeline.test.ts`

**Interfaces:** `discover.ts` writes a manifest, `crawl.ts` writes cached page JSON, `normalize.ts` maps a source product to `ThanhThuyProduct`, `import.ts` writes catalog/media/report, and `validate.ts` exits non-zero for invalid data.

- [ ] Write failing tests for source URL scope, code/slug dedupe, quality statuses, no fake offer, and idempotent normalization.
- [ ] Run `npm test -- tests/thanh-thuy-pipeline.test.ts` and confirm the expected missing-module failures.
- [ ] Implement typed normalized records, deterministic slug/checksum helpers, retry/backoff cache, safe HTML text extraction, and quality classification.
- [ ] Implement Sharp local WebP derivatives with content-hash dedupe and meaningful filenames; never emit a supplier URL as a public media path.
- [ ] Implement dry-run, resume, timestamped backup, rollback, and report writing.
- [ ] Add exact scripts `catalog:thanh-thuy:discover`, `catalog:thanh-thuy:import`, `catalog:thanh-thuy:validate`.
- [ ] Run the focused tests, then execute discover/import dry-run against cached/source data.
- [ ] Commit `feat(catalog): add Thanh Thuy product import pipeline`.

### Task 2: Taxonomy, content loading, and route utilities

**Files:**
- Create: `lib/thanh-thuy.ts`, `lib/thanh-thuy-seo.ts`, `lib/thanh-thuy-schema.ts`
- Modify: `lib/content-schema.ts`, `lib/content.ts`, `lib/brands.ts`, `lib/reserved-slugs.ts`, `app/san-pham/[brand]/page.tsx`
- Test: `tests/thanh-thuy-routes.test.ts`, `tests/thanh-thuy-seo.test.ts`

**Interfaces:** `getThanhThuyCatalog()`, `getThanhThuyCategories()`, `getThanhThuyProduct(categorySlug, productSlug)`, `getThanhThuyIndexableProducts()`, `thanhThuyPath()`, `createThanhThuyMetadata()`, and schema builders return stable typed values.

- [ ] Write failing route/metadata tests for trailing slashes, reserved collisions, indexability, unique titles/descriptions, and canonical origin.
- [ ] Implement loaders and taxonomy helpers over `data/catalogs/thanh-thuy/catalog.json` with validation at import/build time.
- [ ] Add original category copy and Tùng Phát CTA/service guidance in `lib/thanh-thuy-seo.ts`.
- [ ] Update the existing `/san-pham/[brand]` dispatcher to support category slugs while preserving non-Thanh-Thuy brand pages and excluding duplicate Thanh Thuy canonical output.
- [ ] Run focused route/SEO tests and commit `feat(catalog): add supplier taxonomy and product schema`.

### Task 3: Brand, category, product, search, and media UI

**Files:**
- Create: `app/thuong-hieu/thanh-thuy/page.tsx`, `app/san-pham/[category]/[slug]/page.tsx`, `components/thanh-thuy/ThanhThuyExplorer.tsx`, `components/thanh-thuy/ThanhThuyProductDetail.tsx`, `components/thanh-thuy/ThanhThuyCategory.tsx`, `components/thanh-thuy/ThanhThuyBrand.tsx`, `components/thanh-thuy/MaterialSwatchImage.tsx`
- Modify: `app/san-pham/[brand]/page.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `app/globals.css`
- Test: `tests/thanh-thuy-ui.test.tsx`, `e2e/thanh-thuy.spec.ts`

**Interfaces:** UI consumes typed catalogue data and calls the shared business settings for phone/Zalo/locations; Zalo links encode “Tôi cần kiểm tra sản phẩm Thanh Thuỳ mã [MÃ] tại Tùng Phát.”

- [ ] Write failing component/E2E assertions for accessible search/filter labels, keyboard focus, copy-code, Zalo CTA, empty/error states, and mobile layout.
- [ ] Implement the brand landing page with original copy, category cards, service links, branch data, FAQ, breadcrumbs, and supplier source note.
- [ ] Implement distinct top-category/series pages with material characteristics, applications, selection guidance, FAQ, product list, and quote CTA.
- [ ] Implement product pages for all records, showing sourced facts and `noindex` status for non-ready records; add local responsive images and broken-image fallback.
- [ ] Implement client-side search/filter by name/code/category/series/color/pattern without indexable query URLs.
- [ ] Link relevant existing MDF/Melamine/Laminate/Acrylic/CNC pages using contextual anchors.
- [ ] Run focused tests and commit `feat(catalog): add Thanh Thuy catalogue pages`.

### Task 4: SEO, sitemap, robots, and audits

**Files:**
- Modify: `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `lib/seo.ts`, `components/JsonLd.tsx`
- Create: `scripts/thanh-thuy/duplication-audit.ts`, `docs/seo/THANH_THUY_DUPLICATION_AUDIT.md`, `docs/seo/THANH_THUY_IMPORT_REPORT.md`, `docs/seo/THANH_THUY_CATALOG_RUNBOOK.md`
- Test: `tests/thanh-thuy-seo.test.ts`, `scripts/check-thanh-thuy-catalog.mjs`

**Interfaces:** sitemap consumes indexable catalog routes only; JSON-LD builders never emit `Offer` without real price/currency/availability; duplication audit outputs source similarity and readiness status.

- [ ] Write failing tests for sitemap canonical membership, noindex exclusion, Product JSON-LD fields, no source-domain canonical/hotlink, and robots query safeguards.
- [ ] Implement metadata and structured data for Organization/LocalBusiness/WebSite/WebPage/BreadcrumbList/Product/ProductGroup/ItemList as appropriate.
- [ ] Update sitemap to include brand, category, and READY product routes only; preserve existing route entries and trailing slash behavior.
- [ ] Keep robots CSS/JS/images crawlable and disallow preview/search query traps.
- [ ] Run the duplication audit against cached source text and generated Tùng Phát copy; classify technical source facts versus marketing text.
- [ ] Write the import report/runbook with exact commands for crawl, dry-run, import, validate, build, test, rollback, updates, and errors.
- [ ] Commit `feat(seo): add product metadata and structured data` and `docs(catalog): add catalogue runbook and audit reports`.

### Task 5: Verification and handoff

**Files:**
- Modify: `docs/seo/THANH_THUY_CATALOG_FINAL_REPORT.md`
- Test: existing unit, build, link, static output, Playwright, Lighthouse-equivalent local checks, secret scan

- [ ] Run `npm run catalog:thanh-thuy:validate` and import dry-run twice; verify no duplicates and no hotlinks.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, `npm run validate:links`, and existing quality gates; record the pre-existing Cloudflare typecheck issue separately if still present.
- [ ] Run Playwright/axe checks on brand, large category, product, mobile and desktop pages; run local Lighthouse or equivalent performance checks.
- [ ] Run secret scan and inspect staged files for cookies, tokens, cache, browser profiles, and build artifacts.
- [ ] Confirm exported sitemap URLs resolve to canonical HTML and internal links have no 404s.
- [ ] Write final report with branch/base/final commit, discovery/import/SEO/quality counts, risks, and explicit “Production mutation: NONE / Production deployment: NOT PERFORMED”.
- [ ] Commit `test(catalog): add import and SEO validation` and final report changes.

# Supplier Color Code Media Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and preview a verified, media-complete public "Mã màu" catalogue for An Cường, Thanh Thuỳ, and Ba Thanh without deleting raw supplier evidence.

**Architecture:** Keep existing import/provenance artifacts as the audit layer and generate a new canonical `supplier-color-codes.json` public artifact through supplier-aware evidence classifiers. Supplier-specific media discovery/download/validation feeds that artifact, while public search, routes, counts, sitemap, and UI consume only verified color codes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Playwright, Sharp, Node.js crawler scripts, Cloudflare Pages/Wrangler.

## Global Constraints

- Media rights remain exactly `UNCONFIRMED`.
- Do not delete raw source manifests or provenance.
- Do not create AI images, infer color/pattern from images, recolor, crop away texture, or upscale.
- Public color records require `confidence: "verified"`, a non-empty exact code, and one accepted evidence type.
- Source media exposed plus missing local preview is a hard failure.
- No production deploy, main merge, DNS change, paid service, or force push.

---

### Task 1: Baseline And Derived Data Contract

**Files:**
- Create: `lib/catalog/color-codes/types.ts`
- Create: `lib/catalog/color-codes/normalize.ts`
- Create: `tests/color-code-types.test.ts`

**Interfaces:**
- Produces: `CatalogueRecordPurpose`, `SupplierColorCode`, `SupplierColorImage`, `ColorCodeEvidence`, `normalizeColorCode`, and `buildColorCodeAliases`.

- [ ] Write a failing test proving color records require non-empty exact codes, verified confidence, allowed suppliers/materials/evidence, deterministic normalized codes, and aliases such as `MS465SC04`, `MS 465 SC04`, and `465 SC04`.
- [ ] Run `npx vitest run tests/color-code-types.test.ts` and confirm the expected missing-module/behavior failure.
- [ ] Implement the minimal types and normalization helpers.
- [ ] Run the focused test and commit the green result.

### Task 2: Supplier Evidence Classifiers

**Files:**
- Create: `lib/catalog/color-codes/classify.ts`
- Create: `lib/catalog/color-codes/an-cuong.ts`
- Create: `lib/catalog/color-codes/ba-thanh.ts`
- Create: `lib/catalog/color-codes/thanh-thuy.ts`
- Create: `tests/supplier-color-code-classifier.test.ts`

**Interfaces:**
- Consumes: raw normalized supplier records and Task 1 types.
- Produces: `classifyAnCuongRecord`, `classifyBaThanhRecord`, `classifyThanhThuyRecord`, and `buildSupplierColorCodeAudit`.

- [ ] Write failing fixtures for official color maps, decorative detail evidence, matching codes, generic families, documents, technical-only records, empty codes, and duplicate aliases.
- [ ] Run the focused test and confirm families/documents/code-less rows currently leak or no classifier exists.
- [ ] Implement supplier-specific evidence rules without a simple `has code` shortcut.
- [ ] Run the focused test and commit the green result.

### Task 3: Canonical Color-Code Artifact

**Files:**
- Create: `scripts/catalog-suppliers/build-color-code-index.ts`
- Create: `data/catalogs/supplier-color-codes.json`
- Modify: `package.json`
- Create: `tests/supplier-color-code-index.test.ts`

**Interfaces:**
- Produces: schema-versioned artifact with records, supplier/material totals, removed-purpose totals, aliases, checksum, and media metrics.

- [ ] Write a failing test that reconciles all 3,558 legacy searchable records while exposing only verified color codes.
- [ ] Assert no family/document/technical/other record, empty code, unverified confidence, duplicate canonical identity, or mixed count enters the public artifact.
- [ ] Implement deterministic generation and checksum output, then run the generator.
- [ ] Run focused tests and commit the generated artifact and generator.

### Task 4: Live Source And Media Root-Cause Audit

**Files:**
- Create: `data/imports/an-cuong/color-media-discovery.json`
- Create: `data/imports/ba-thanh/color-media-discovery.json`
- Create: `data/imports/thanh-thuy/color-media-discovery.json`
- Create: `docs/catalogue/AN_CUONG_MEDIA_RECOVERY_REPORT.md`

**Interfaces:**
- Produces: per-code discovered media roles and reason codes `SOURCE_HAS_IMAGE_BUT_PARSER_MISSED`, `SOURCE_HAS_IMAGE_DOWNLOAD_FAILED`, `SOURCE_IMAGE_LAZY`, `SOURCE_IMAGE_CSS`, `SOURCE_IMAGE_FULLSHEET_ONLY`, `SOURCE_NO_IMAGE`, `INVALID_IMAGE`, and `DUPLICATE_IMAGE`.

- [ ] Inspect official color maps and representative detail pages with the in-app Browser, Chromium network inspection, and Playwright.
- [ ] Trace `original-only`, `deferred`, blank-card, fullsheet, zoom, lazy, CSS, JSON-LD, hydration, and XHR mechanisms to root causes before changing code.
- [ ] Record exact source URLs, public media endpoints, roles, and no-media evidence; unknown reasons are not allowed.
- [ ] Save selected before evidence under `output/playwright/` and commit audit artifacts that do not contain caches or secrets.

### Task 5: Resumable Media Pipelines

**Files:**
- Create: `scripts/ancuong/media-discover.ts`
- Create: `scripts/ancuong/media-download.ts`
- Create: `scripts/ancuong/media-validate.ts`
- Create: `scripts/ba-thanh/media-discover.ts`
- Create: `scripts/ba-thanh/media-download.ts`
- Create: `scripts/ba-thanh/media-validate.ts`
- Modify: `lib/catalog/full-import/media.ts`
- Modify: `package.json`
- Create: `tests/color-code-media-pipeline.test.ts`

**Interfaces:**
- Produces: cached discovery manifests, content-addressed originals, deterministic code/role derivatives, validation reports, and per-code local media assignments.

- [ ] Write failing tests for allowlists, redirects, retry/backoff, cache resume, checksum dedup, MIME/dimensions, HTML error bodies, transparent placeholders, unsafe filenames, source-media/local-preview gaps, and role priority.
- [ ] Run focused tests and confirm the current deferred-only behavior fails the new accounting contract.
- [ ] Implement minimal discovery/download/validation utilities and supplier adapters.
- [ ] Run focused tests, then execute resumable live pipelines and commit validated manifests plus permitted preview media.

### Task 6: Public Search, Counts, Filters, Routes, And SEO

**Files:**
- Modify: `lib/catalog/core/types.ts`
- Modify: `lib/catalog/core/search.ts`
- Modify: `lib/catalog/material-taxonomy.ts`
- Modify: `lib/catalog/suppliers/search-index.ts`
- Modify: `lib/catalog/suppliers/search.ts`
- Modify: `lib/catalog/suppliers/*.ts`
- Modify: `app/sitemap.ts`
- Create: `tests/public-color-code-search.test.ts`
- Modify: `tests/supplier-navigation-sitemap.test.ts`

**Interfaces:**
- Consumes: canonical color-code artifact.
- Produces: verified-only search, generated non-empty filters/counts, route claims, sitemap entries, and exact-code ranking.

- [ ] Write failing tests for exact An Cường, Ba Thanh, and Thanh Thuỳ searches; family/document exclusion; material filters; counts; sitemap; and route generation.
- [ ] Run focused tests and verify the mixed 3,558-record index fails them.
- [ ] Switch public adapters/search to the verified artifact and implement required ranking/order semantics.
- [ ] Run focused tests and commit the green result.

### Task 7: Public "Mã màu" UI And Detail Media

**Files:**
- Modify: `app/catalogue/page.tsx`
- Modify: `app/catalogue/[brand]/page.tsx`
- Modify: `app/catalogue/an-cuong/[category]/page.tsx`
- Modify: `app/ma-mau-melamine/ba-thanh/**`
- Modify: `app/thuong-hieu/thanh-thuy/page.tsx`
- Modify: `components/catalog/**`
- Modify: `components/site/SiteHeader.tsx`
- Modify: `components/site/SiteFooter.tsx`
- Create: `tests/color-code-public-ui.test.tsx`

**Interfaces:**
- Produces: customer-facing `Mã màu` copy, verified-only cards, explicit no-source-image state, prioritized image galleries, copy-code/Zalo actions, and responsive non-truncated codes.

- [ ] Write failing render tests for H1, navigation, placeholder, breadcrumbs, counts, no mixed terminology, no empty image source, no white placeholder frame, and media priority.
- [ ] Run focused tests and confirm current catalogue wording/mixed cards fail.
- [ ] Implement the UI changes while preserving technical/family pages outside the color browsing experience.
- [ ] Run focused tests and commit the green result.

### Task 8: Supplier Reports And Accounting Gates

**Files:**
- Create: `docs/catalogue/AN_CUONG_COLOR_CODE_AUDIT.md`
- Update: `docs/catalogue/AN_CUONG_MEDIA_RECOVERY_REPORT.md`
- Create: `docs/catalogue/BA_THANH_COLOR_MEDIA_AUDIT.md`
- Create: `docs/catalogue/THANH_THUY_COLOR_CODE_AUDIT.md`
- Create: `docs/catalogue/SUPPLIER_COLOR_CODE_FINAL_REPORT.md`
- Create: `scripts/catalog-suppliers/color-code-audit.ts`
- Create: `tests/color-code-audit-report.test.ts`

**Interfaces:**
- Produces: deterministic report metrics and hard failure on unknown/deferred source-media gaps.

- [ ] Write failing tests for every requested report metric and media recovery formula.
- [ ] Implement deterministic report generation from canonical artifacts and validation manifests.
- [ ] Run reports and focused tests; commit reports only after counts reconcile.

### Task 9: Visual And End-To-End Audit

**Files:**
- Modify: `e2e/supplier-catalogue.spec.ts`
- Add selected screenshots: `docs/uiux/catalogue/color-code-audit/`

**Interfaces:**
- Produces: desktop/mobile evidence for the required routes and browser assertions for exact search and media delivery.

- [ ] Add failing Playwright assertions for public terminology, exact code searches, non-empty media states, zero image 404s, and representative supplier/material/detail routes.
- [ ] Run the focused journey against the local production build and fix only reproduced failures.
- [ ] Capture selected 1440x900 and 390x844 evidence; inspect logo misuse, application-as-primary, loading flash, duplicate images, code truncation, and crop.
- [ ] Commit the green e2e coverage and selected evidence.

### Task 10: Full Verification And Preview Delivery

**Files:**
- Update: `docs/catalogue/SUPPLIER_COLOR_CODE_FINAL_REPORT.md`

**Interfaces:**
- Produces: verified final commit, pushed branch, draft PR based on `codex/catalog-full-supplier-import`, Cloudflare preview, and smoke-test evidence.

- [ ] Run lint, typecheck, full Vitest, Playwright, production build, link audit, media audit, search audit, sitemap/canonical/JSON-LD checks, accessibility, Lighthouse, and secret scan.
- [ ] Reconcile failures through systematic debugging and rerun each complete gate.
- [ ] Commit final verified artifacts, confirm clean worktree, push without force, create/update a draft PR, and deploy only a Cloudflare preview.
- [ ] Smoke test the real preview URL and write the requested final report format without claiming production readiness or media rights.

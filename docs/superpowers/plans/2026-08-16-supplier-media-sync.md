# Supplier Media Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl, validate, store, and display every directly associated full-size product image for An Cuong, Thanh Thuy, and Ba Thanh.

**Architecture:** Extend existing supplier discovery with shared original-resolution, classification, audit, dedupe, and R2 synchronization modules. Keep primary thumbnails cheap and load R2 originals through an accessible on-demand gallery.

**Tech Stack:** TypeScript, Node.js, Vitest, Sharp, Next.js 15/React 19, Cloudflare R2/Pages, Wrangler, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-16-supplier-media-sync-design.md`

## Global Constraints

- Retain all source-associated texture, detail, board, edge, room, application, and other product media.
- Reject covers, banners, logos, placeholders, and media without product association evidence.
- Store full native-resolution originals in R2 and serve no supplier runtime hotlinks.
- Preserve existing unrelated work and do not delete old R2 objects without proven reference safety.
- Production is complete only after direct desktop/mobile/network verification on `https://mdftungphat.com`.

---

### Task 1: Shared Media Contracts And Resolution

**Files:**
- Create: `lib/catalog/supplier-media/types.ts`
- Create: `lib/catalog/supplier-media/resolve.ts`
- Create: `lib/catalog/supplier-media/classify.ts`
- Create: `tests/supplier-media-resolution.test.ts`

**Interfaces:**
- Produces: `resolveOriginalMedia(candidates)`, `classifySupplierMedia(context)`, `dedupeSupplierMedia(items)`, and `selectPrimaryMedia(items)`.

- [ ] Write literal-fixture tests for largest `srcset`, lightbox/data original priority, resize suspicion, room association, cover/placeholder rejection, checksum dedupe, gallery order, and primary selection.
- [ ] Run `npx vitest run tests/supplier-media-resolution.test.ts` and confirm failures are caused by missing contracts.
- [ ] Implement the typed resolver/classifier/dedupe/ordering functions without network side effects.
- [ ] Run the focused test until it passes, then run existing supplier media tests.

### Task 2: Supplier Product Discovery And Galleries

**Files:**
- Modify: `scripts/ba-thanh/discover-full.ts`
- Modify: `scripts/ba-thanh/crawl-full.ts`
- Modify: `lib/catalog/ba-thanh-source.ts`
- Modify: `scripts/thanh-thuy/crawl.ts`
- Modify: `scripts/thanh-thuy/types.ts`
- Modify: `scripts/ancuong/media-discover.ts`
- Create: `tests/supplier-media-crawlers.test.ts`

**Interfaces:**
- Consumes: shared resolution/classification contracts.
- Produces: every product-associated media candidate plus association evidence and accepted canonical source page.

- [ ] Write failing tests for Ba Thanh standard/WAY/alternate code slugs, unknown WAY prefixes discovered from source, page-code validation, WordPress gallery/media fields, An Cuong application gallery retention, and room sections.
- [ ] Run the focused crawler tests and confirm each expected failure.
- [ ] Implement candidate URL validation and complete supplier gallery extraction while retaining current code identity rules.
- [ ] Run focused and existing Ba Thanh/Thanh Thuy/An Cuong tests until green.

### Task 3: Audit, Download, Deduplication, And R2 Sync

**Files:**
- Create: `scripts/catalog-suppliers/media-audit.ts`
- Create: `scripts/catalog-suppliers/r2-media-sync.ts`
- Modify: `scripts/catalog-suppliers/color-media.ts`
- Modify: `scripts/catalog-suppliers/merge-color-media.ts`
- Modify: `package.json`
- Create: `tests/supplier-media-audit.test.ts`

**Interfaces:**
- Produces: `data/imports/suppliers/media-audit.json`, deterministic R2 keys/URLs, retained catalogue gallery references, and an orphan candidate report.

- [ ] Write failing tests for decode/size validation, full-size replacement, deterministic keys, idempotent reuse, upload retry, final references, and zero supplier URLs in runtime fields.
- [ ] Implement resumable downloads, Sharp inspection, SHA-256 dedupe, R2 upload/HEAD verification, audit summaries, and orphan candidate accounting.
- [ ] Run focused tests, then crawl all three suppliers and sync all retained objects with bounded concurrency.
- [ ] Re-run validation from saved artifacts and require broken objects and resolvable crop suspects to equal zero.

### Task 4: R2 Public Image Delivery

**Files:**
- Modify: `cloudflare-cms/src/media/handler.ts`
- Modify: `cloudflare-cms/tests/media.test.ts`
- Modify: `cloudflare-cms/README.md`

**Interfaces:**
- Consumes: keys under `supplier/` and existing `videos/` keys.
- Produces: immutable GET/HEAD delivery from `https://cms.mdftungphat.com/media/<key>` with stored image MIME.

- [ ] Write failing tests that accept safe `supplier/` image keys, reject traversal/unknown prefixes, preserve video ranges, and return stored image MIME.
- [ ] Run `npm --prefix cloudflare-cms test -- media.test.ts` and confirm the new image case fails.
- [ ] Extend key validation and MIME fallback without weakening traversal protections.
- [ ] Run CMS lint, typecheck, tests, dry-run, deploy production, and verify an uploaded image by HEAD and decoded GET.

### Task 5: Catalogue Gallery UI

**Files:**
- Create: `components/catalog/SupplierMediaGallery.tsx`
- Modify: catalogue detail/card components identified by route inspection.
- Modify: `lib/catalog/color-codes/types.ts`
- Create: `tests/catalogue-media-gallery.test.tsx`
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Consumes: ordered R2-backed gallery items and optimized primary thumbnail.
- Produces: accessible on-demand full-size lightbox with counter, keyboard, backdrop, touch controls, and contained images.

- [ ] Write failing component/E2E tests for primary choice, no eager original loads, open/close, next/previous, counter, arrows, Escape, backdrop, R2-only sources, and gallery ordering.
- [ ] Implement the client gallery following the existing catalogue visual language and responsive conventions.
- [ ] Run focused UI tests and production-like E2E at desktop and mobile viewports.

### Task 6: Full Validation And Production

**Files:**
- Update generated catalogue/manifests/reports produced by Tasks 2-3.

**Interfaces:**
- Produces: committed production data/code and the requested supplier completeness report.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, supplier validations, media validation, `npm run build`, `npm run test:e2e`, and `git diff --check` with fresh output.
- [ ] Inspect at least ten codes per supplier plus all recovered/missing codes against source counts, R2 objects, and catalogue galleries.
- [ ] Commit intended files, push `main`, wait for Vercel and Cloudflare deployments, and inspect production console/network on desktop and mobile.
- [ ] Verify BT182, P2061, F3292, room/application navigation, full-size R2 delivery, zero runtime supplier hotlinks, and publish the final machine-readable totals.

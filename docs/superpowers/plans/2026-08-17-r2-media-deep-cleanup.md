# R2 Media Deep Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit every An Cuong gallery and the complete production R2 bucket, safely remove proven duplicate references and objects, repair Payload consistency, deploy, and verify production.

**Architecture:** Build deterministic, resumable TypeScript audit tooling around the current supplier catalogue artifacts, Payload D1 schema, and the production R2 binding. Separate candidate detection from destructive execution: inventory and reference graph first, mandatory dry-run and delete manifest second, phased mutations third, then comprehensive production verification.

**Tech Stack:** TypeScript, Vitest, Sharp, Payload CMS 3.88.0, Cloudflare D1/R2, Wrangler 4, Next.js, Playwright.

**Spec:** User-approved task specification in the 2026-08-17 conversation.

## Global Constraints

- Data integrity and full-size texture fidelity take priority over storage savings.
- Perceptual hashes identify candidates only; destructive visual deduplication requires geometry and normalized-pixel confirmation.
- Unknown or ambiguous objects are kept.
- No object is deleted before references are repointed and a second orphan pass agrees.
- Production is complete only after direct verification of `https://mdftungphat.com` and `https://cms.mdftungphat.com`.

---

### Task 1: Pure Media Comparison And Canonical Selection

**Files:**
- Create: `scripts/media-cleanup/model.ts`
- Create: `scripts/media-cleanup/image-compare.ts`
- Create: `scripts/media-cleanup/canonical.ts`
- Test: `tests/media-cleanup-image-compare.test.ts`

**Interfaces:**
- Produces: normalized media identities, exact/visual classification, conservative confidence evidence, and deterministic canonical selection.

- [ ] Write failing tests for same-reference normalization, SHA-256 equality, resized/re-encoded equality, intentional crop rejection, room/swatch rejection, and full-size canonical priority.
- [ ] Run the focused Vitest file and confirm failures are caused by missing implementation.
- [ ] Implement the minimum comparison and canonical-selection functions with Sharp-derived normalized pixels.
- [ ] Run focused tests until green and refactor without changing behavior.

### Task 2: Production Inventory And Complete Reference Graph

**Files:**
- Create: `scripts/media-cleanup/r2-inventory-worker.ts`
- Create: `scripts/media-cleanup/reference-graph.ts`
- Create: `scripts/media-cleanup/audit-production.ts`
- Test: `tests/media-cleanup-reference-graph.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: supplier catalogue artifacts, D1 query exports, repository source scan, and paginated R2 listing.
- Produces: complete object inventory and normalized consumers across Payload, frontend, SEO, generated data, and supplier mappings.

- [ ] Write failing tests for URL/key normalization, encoded paths, query stripping, indirect JSON references, hardcoded source references, and orphan classification.
- [ ] Implement read-only R2 pagination through the production binding and D1/reference ingestion.
- [ ] Run the inventory against all production objects and persist resumable audit state outside committed generated data.
- [ ] Reconcile R2 totals against bucket metrics and classify `UNKNOWN` as keep.

### Task 3: An Cuong Gallery Audit And Dry Run

**Files:**
- Create: `scripts/media-cleanup/an-cuong-audit.ts`
- Create: `scripts/media-cleanup/dry-run.ts`
- Test: `tests/media-cleanup-an-cuong.test.ts`
- Modify: `lib/catalog/color-codes/types.ts`
- Modify: `app/catalogue/[supplier]/[material]/[code]/page.tsx`

**Interfaces:**
- Produces: per-code image 1/2 and full-gallery groups, canonical full-size images with optional lightweight thumbnail display sources, `r2-cleanup-dry-run.json`, and the delete safety manifest.

- [ ] Write failing tests for gallery compaction, thumbnail-to-canonical attachment, cross-code reuse, application-image preservation, and stable ordering.
- [ ] Audit all An Cuong codes with two or more images using exact reference, binary, perceptual, geometry, and normalized-pixel evidence.
- [ ] Generate the mandatory dry-run report and representative examples before any mutation.
- [ ] Require ambiguous cases to remain unchanged and record them as keep.

### Task 4: Phased Production Mutation

**Files:**
- Create: `scripts/media-cleanup/execute.ts`
- Test: `tests/media-cleanup-execute.test.ts`
- Modify: generated supplier catalogue artifacts only when confirmed references change.
- Modify: Payload D1 records and gallery rows through generated transactional SQL.

**Interfaces:**
- Consumes: immutable dry-run and delete manifests.
- Produces: idempotent Phase A-F reference updates, verified object deletions, and post-mutation consistency reports.

- [ ] Write failing tests proving execution rejects stale ETags, missing canonical replacements, non-zero consumers, and single-pass orphan evidence.
- [ ] Execute An Cuong reference repair, verify, then delete only unreferenced duplicate objects.
- [ ] Execute global exact deduplication, double-verified orphan deletion, safe lossless optimization, and Payload consistency repair.
- [ ] Re-inventory after every destructive phase and stop on count/hash/reference drift.

### Task 5: Verification, Deployment, And Production Crawl

**Files:**
- Create: `scripts/media-cleanup/production-crawl.ts`
- Test: `tests/media-cleanup-production-crawl.test.ts`
- Modify: `e2e/supplier-catalogue.spec.ts`

**Interfaces:**
- Produces: comprehensive An Cuong crawl, supplier media integrity results, SEO/OG checks, before/after performance evidence, and final report totals.

- [ ] Run root and Payload typecheck, lint, unit, integration, build, and E2E suites with zero failures.
- [ ] Commit and push intended changes, deploy the Payload worker and site using the repository's production workflow, and wait for readiness.
- [ ] Crawl every public An Cuong material page and representative Thanh Thuy/Ba Thanh pages; require zero broken, blank, corrupt, MIME-mismatched, SEO, or OG images.
- [ ] Inspect production desktop/mobile console and network state and report exact before/after R2 and integrity totals.

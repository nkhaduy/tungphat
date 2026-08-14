# Media Externalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move production catalogue/generated media from Git to existing R2 storage while preserving public URLs and preventing future reintroduction.

**Architecture:** Upload unique production media to `tung-phat-media`, serve it through the existing Cloudflare CMS R2 binding, and proxy unchanged `/catalog/...` URLs from Vercel. A tested inventory/sync module and compact manifest make future imports incremental and Git-safe.

**Tech Stack:** TypeScript, Node.js, Vitest, Next.js static export, Vercel rewrites, Cloudflare Pages, R2, Wrangler.

---

### Task 1: Inventory And Dedupe Engine

**Files:**
- Create: `scripts/media/core.ts`
- Create: `scripts/media/inventory.ts`
- Test: `tests/media-core.test.ts`

- [ ] Write failing tests for media classification, logical keys, reference extraction, SHA-256 dedupe, canonical aliases, MIME/cache metadata, and tracked-file rejection.
- [ ] Run `npm test -- tests/media-core.test.ts` and confirm failures are caused by missing media functions.
- [ ] Implement the smallest pure functions and inventory CLI needed by the tests.
- [ ] Run the targeted tests and produce `reports/media-inventory.json` from the real tree.

### Task 2: Incremental R2 Sync And Manifest

**Files:**
- Create: `scripts/media/r2.ts`
- Create: `scripts/media/sync.ts`
- Create: `data/catalog-media-manifest.json`
- Modify: `package.json`
- Test: `tests/media-sync.test.ts`

- [ ] Write failing tests for idempotent skip/upload behavior, alias entries, verification, and temporary cleanup using injected storage operations.
- [ ] Run the targeted test and confirm the expected failures.
- [ ] Implement `npm run media:inventory`, `npm run media:sync`, and `npm run media:verify` with bounded concurrency and correct object metadata.
- [ ] Run inventory, upload unique retained objects, verify counts/hashes, and generate the compact manifest.

### Task 3: External Delivery With Stable URLs

**Files:**
- Modify: `cloudflare-cms/src/media/handler.ts`
- Modify: `cloudflare-cms/tests/media.test.ts`
- Modify: `vercel.json`
- Modify: `lib/media.ts`
- Modify: `tests/media.test.ts`

- [ ] Write failing tests for catalogue R2 GET/HEAD, immutable caching, safe keys, same-origin default URLs, and optional external base URLs.
- [ ] Run the targeted website and CMS tests and confirm the failures.
- [ ] Extend the existing media handler and central URL resolver, then add the Vercel catalogue rewrite.
- [ ] Deploy the CMS and verify representative R2 catalogue objects before removing any source file.

### Task 4: Import/Crawl Guardrails

**Files:**
- Create: `scripts/media/check-git.ts`
- Modify: `scripts/catalog-suppliers/color-media.ts`
- Modify: supplier media download/import scripts as identified by inventory
- Modify: `.gitignore`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/optimize-cms-images.yml`
- Test: `tests/media-pipeline.test.ts`

- [ ] Write failing tests proving crawler downloads use ignored temporary paths, publishing calls external storage, cleanup runs, and tracked catalogue media fails CI.
- [ ] Run the targeted tests and confirm the expected failures.
- [ ] Refactor the shared supplier media path to stage, upload, record logical keys, and clean temporary binaries.
- [ ] Add Git ignore/CI guardrails without ignoring small intentional design assets.

### Task 5: Remove Current-Tree Binaries

**Files:**
- Remove from Git: `public/catalog/**`
- Update: `data/catalog-media-manifest.json`

- [ ] Confirm every retained logical path resolves to a verified R2 object or alias.
- [ ] Remove tracked catalogue binaries and safe unreferenced generated media from the current tree.
- [ ] Run `git ls-files` verification and confirm tracked catalogue media is zero.
- [ ] Clean ignored build/cache/report artifacts that belong to this repo and are safe to regenerate.

### Task 6: Quality Gates And Production

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run targeted lint/tests for media and CMS delivery.
- [ ] Run full lint, typecheck, tests, and production build once.
- [ ] Run representative Playwright E2E and production smoke checks.
- [ ] Commit, push, deploy CMS and Vercel production, wait for readiness, and verify `https://mdftungphat.com` on desktop/mobile including catalogue, color code, category, product, gallery, search, breadcrumb, OG, 404, console, and failed network requests.

### Task 7: Final Git And History Audit

**Files:**
- Create: `reports/media-final-summary.json` (ignored operational report)

- [ ] Measure tracked file count/bytes/media bytes, `.git` size, discoverable context, R2 objects/bytes, and production request results.
- [ ] Audit historical media blobs, branches, tags, remotes, worktrees, and unpushed commits.
- [ ] Rewrite history only if all active references can safely migrate; otherwise record `HISTORY_REWRITE_DEFERRED` with exact reasons and clone impact.
- [ ] Produce the requested final report from fresh command/browser evidence.

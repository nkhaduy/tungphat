# Supplier Catalogue Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the pinned Thanh Thuy, Ba Thanh, and An Cuong catalogue snapshots on the audited production baseline without modifying protected workspaces or production systems.

**Architecture:** Replay supplier commits onto `ed07a2a`, preserve namespaced pipelines/data/media, then introduce a small supplier registry for shared search, sitemap, routes, metadata, and UI primitives. Supplier-specific schemas and quality policies remain behind adapters.

**Tech Stack:** Next.js 15.5.21, React 19, TypeScript 5.9, Vitest 4, Playwright, npm, static export.

## Global Constraints

- Work only in `/Users/khaduy/Downloads/tungphat-supplier-catalog-integration` on `codex/catalog-suppliers-integration`.
- Do not checkout, reset, clean, stash, restore, push, deploy, mutate production, or edit protected worktrees.
- Integrate Thanh Thuy through `280ad65`, Ba Thanh through `6675ac7`, and An Cuong only through pinned `6d158c1`.
- Preserve Next.js 15.5.21 and the audited `ed07a2a` SEO/security baseline.
- Keep media local and supplier-namespaced; deployment remains blocked pending rights confirmation.
- Use tests before new shared behavior and fresh verification before commits/completion.

---

### Task 1: Commit graph and integration baseline

**Files:**
- Create: `docs/seo/SUPPLIER_CATALOG_INTEGRATION_BASELINE.md`
- Create: `docs/seo/SUPPLIER_CATALOG_CONFLICT_MATRIX.md`
- Create: `docs/seo/SUPPLIER_CATALOG_ARCHITECTURE.md`

- [ ] Verify exact refs, actual tips, ancestry, pairwise merge bases, commit ranges, and file ranges.
- [ ] Record protected-workspace status and the known baseline typecheck dependency failure.
- [ ] Commit with `chore(catalog): create supplier integration baseline`.

### Task 2: Replay Thanh Thuy snapshot

**Files:** supplier commits `2bd76b8..280ad65`; conflicts in package, SEO, routes, navigation, content, and lockfile.

- [ ] Cherry-pick the five commits in authored order.
- [ ] Resolve conflicts by preserving `ed07a2a` production SEO/content and adding catalogue behavior.
- [ ] Regenerate the npm lockfile and run Thanh Thuy pipeline/tests.
- [ ] Verify 26 categories, 348 products, media paths, index/noindex policy, routes, and sitemap intent.

### Task 3: Replay Ba Thanh snapshot

**Files:** supplier commits `5e0af9d..6675ac7`; conflicts in package, robots, sitemap, product hub, header/footer, and shared content.

- [ ] Cherry-pick the eight commits in authored order.
- [ ] Resolve conflicts without replacing Thanh Thuy behavior or `ed07a2a` fixes.
- [ ] Run Ba Thanh validation/tests and verify 233 codes, four groups, 474 WebP, 6 indexable code pages, 227 noindex code pages, and 12 sitemap URLs.

### Task 4: Replay An Cuong requested snapshot

**Files:** commits `b5ce145..6d158c1`, `scripts/ancuong/**`, `schemas/**`, `data/imports/ancuong/**`, `tests/ancuong/**`, package scripts.

- [ ] Cherry-pick exactly six requested commits and exclude `c0ab3ae..caa911a`.
- [ ] Merge package scripts while keeping all earlier supplier scripts.
- [ ] Run An Cuong unit/pipeline validation against fixtures and local exports.
- [ ] Verify `/catalogue/an-cuong/`, title suffix, H1, canonical, and existing public-route behavior.

### Task 5: Shared catalogue core via TDD

**Files:**
- Create: `lib/catalog/core/types.ts`
- Create: `lib/catalog/core/registry.ts`
- Create: `lib/catalog/core/search.ts`
- Create: `lib/catalog/core/sitemap.ts`
- Create: `lib/catalog/core/routes.ts`
- Create: `lib/catalog/suppliers/{thanh-thuy,ba-thanh,an-cuong}.ts`
- Test: `tests/supplier-catalog-*.test.ts`

- [ ] Write failing tests for supplier registration, exact-code ranking, supplier route ownership, indexable-only sitemap composition, duplicate rejection, and brand-isolated metadata.
- [ ] Run targeted tests and confirm expected failures.
- [ ] Implement minimal pure functions and adapters.
- [ ] Run targeted and existing supplier tests; refactor only while green.

### Task 6: Shared navigation, sitemap, robots, and package scripts

**Files:** `components/Header.tsx`, `components/Footer.tsx`, `app/sitemap.ts`, `app/robots.ts`, `package.json`, generated `package-lock.json`.

- [ ] Add tests for compact navigation and composed supplier sitemap before changing shared files.
- [ ] Use registry data for supplier links and sitemap entries without loading catalogue JSON into global client bundles.
- [ ] Add aggregate `catalog:suppliers:*` validation/test/audit scripts.
- [ ] Regenerate lockfile with npm and verify dependency versions did not regress.

### Task 7: Audit routes, SEO, search, structured data, media, and imports

**Files:** audit scripts/tests plus required SEO documentation.

- [ ] Validate route/slug/case/trailing-slash/static-shadow collisions and all sitemap routes.
- [ ] Validate unique title, description, H1, canonical, JSON-LD brand, breadcrumbs, internal links, redirects, and orphan pages.
- [ ] Validate media path/case/checksum/hash/MIME/hotlink status and write provenance.
- [ ] Run safe dry-run/import/idempotency checks for each supplier without production mutation.
- [ ] Scan crawler allowlists, URL validation, unsafe HTML, secrets, tokens, cookies, and environment files.

### Task 8: Quality and performance gates

**Files:** only scoped fixes and performance tests/configuration when a failure proves a catalogue regression.

- [ ] Run formatting check, scoped lint, full lint baseline comparison, typecheck, all tests, and production build.
- [ ] Run static HTML, sitemap, metadata, structured data, and internal-link audits.
- [ ] Run local Lighthouse for homepage and representative supplier hub/category/detail routes where tooling permits.
- [ ] Fix catalogue-scope failures using a failing regression test first.

### Task 9: Final documentation and commits

**Files:**
- Create: `docs/seo/SUPPLIER_CATALOG_CANNIBALIZATION_AUDIT.md`
- Create: `docs/seo/SUPPLIER_MEDIA_PROVENANCE.md`
- Create: `docs/seo/SUPPLIER_CATALOG_INTEGRATION_RUNBOOK.md`
- Create: `docs/seo/SUPPLIER_CATALOG_INTEGRATION_FINAL_REPORT.md`

- [ ] Document exact update/dry-run/validate/test/build/audit/rollback commands and fourth-supplier extension path.
- [ ] Record counts, exclusions, conflicts, rights blocker, quality results, and remaining debt.
- [ ] Verify no conflict markers, secrets, temporary/cache files, protected-workspace changes, or uncommitted files.
- [ ] Commit focused docs/tests/fixes and produce the required final report without push, main merge, or deployment.

# Thanh Thuy Staging QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit, stage, visually verify, repair, and release-check the Thanh Thuy catalogue without mutating production or the original catalogue branch.

**Architecture:** Work from an isolated QA branch based on commit `280ad65f62cc9013b0f478dd0978679d8b2df311`. Treat the static Next.js export as the production artifact, use the existing import/SEO validation scripts as deterministic gates, and use a branch preview with environment-level `X-Robots-Tag` protection for staging QA.

**Tech Stack:** Next.js static export, TypeScript, Vitest, Playwright, axe-core, Lighthouse, npm, Vercel/Cloudflare configuration, Git.

## Global Constraints

- Do not merge into `main`, deploy production, change DNS, change the production custom domain, or mutate production database/storage.
- Preserve `stash@{0}` and all unrelated worktrees; never apply, pop, drop, or edit `.DS_Store`.
- Keep 347 sparse products `noindex` and excluded from sitemap unless verified data quality changes.
- Do not hardcode staging URLs, supplier contact details, fake prices, fake availability, or unsupported official-dealer claims.
- Keep supplier media local, color-neutral, responsive, and free from hotlinks.

---

### Task 1: Workspace And Differential Audit

**Files:**
- Review: all files changed in `5565f40..280ad65`
- Create: `docs/seo/THANH_THUY_DIFFERENTIAL_REVIEW_2026-08-05.md`

- [ ] Verify repository identity, worktrees, branch, remotes, commits, and preserved stash.
- [ ] Run `git diff --stat`, `git diff --check`, history review, risk classification, test-coverage mapping, and large-file/secret/local-path scans.
- [ ] Trace import, route, search/filter, metadata, sitemap, robots, schema, CTA, media, and deployment behavior.
- [ ] Record evidence-backed differential findings with file and line references.

### Task 2: Reproducible Baseline And Import Validation

**Files:**
- Review: `package.json`, CI workflows, `scripts/thanh-thuy/**`, `data/imports/thanh-thuy/**`

- [ ] Run `npm ci` and capture dependency/install timing.
- [ ] Run lint, typecheck, unit/integration tests, catalogue validators, content/image/link checks, production build, E2E, accessibility, and secret scan.
- [ ] Run discovery, dry-run import, validation, second import/idempotency verification, and duplication audit without committing source drift.
- [ ] Capture build time, route count, test count, bundle/static sizes, warnings, and Git status.

### Task 3: Safe Preview Deployment

**Files:**
- Review: `.github/workflows/**`, `vercel.json`, `wrangler.jsonc`, deployment scripts/configuration
- Modify only if required: preview-only deployment configuration or headers

- [ ] Identify the actual preview workflow and existing authenticated deployment surface.
- [ ] Deploy only the QA branch/static artifact to an isolated preview environment.
- [ ] Verify commit/deployment identity and confirm no production resource mutation.
- [ ] Verify live `X-Robots-Tag: noindex, nofollow` behavior without changing production indexing logic.

### Task 4: Browser, SEO, Schema, Accessibility, And Performance QA

**Files:**
- Artifacts: ignored `output/` or external preview evidence
- Create/modify tests only for reproduced bugs

- [ ] Crawl all preview HTML and audit status, redirects, canonicals, metadata, H1, robots, sitemap, internal links, images, query URLs, and staging leakage.
- [ ] Test homepage, eight indexable catalogue routes, representative products, search, filter, CTA, image handling, keyboard flows, and axe at required viewports.
- [ ] Parse JSON-LD for homepage, brand, category, enriched product, sparse product, and multi-image product.
- [ ] Run three mobile and desktop Lighthouse samples for homepage, brand, largest category, multi-image product, and noindex product; diagnose implementation-caused regressions.

### Task 5: Regression Fixes

**Files:**
- Modify: only files implicated by reproduced implementation defects
- Test: matching Vitest/Playwright validation files

- [ ] Write a failing regression test for each reproduced defect.
- [ ] Implement the smallest production-safe fix.
- [ ] Run the focused test and related build/browser check.
- [ ] Re-deploy the QA preview when runtime behavior changes and repeat affected QA.

### Task 6: Final Gates, Report, Commit, And Push

**Files:**
- Create: `docs/seo/THANH_THUY_STAGING_QA_REPORT.md`
- Update: `docs/seo/THANH_THUY_DIFFERENTIAL_REVIEW_2026-08-05.md`

- [ ] Run the complete fresh quality-gate suite, Lighthouse, crawl, schema parse, import idempotency, secret scan, and `git diff --check`.
- [ ] Complete the staging QA report with measured evidence and explicit residual risks.
- [ ] Commit reviewed changes without rewriting catalogue history.
- [ ] Push only the QA branch when remote safety checks pass; do not merge or deploy production.

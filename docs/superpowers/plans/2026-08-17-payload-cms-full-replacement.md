# Payload CMS Full Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Payload CMS the sole production CMS for mdftungphat.com, migrate all required data, preserve frontend/SEO/media behavior, and remove the verified legacy CMS infrastructure.

**Architecture:** Reuse the existing Payload-on-Cloudflare Worker/D1 foundation, bind it to the existing production R2 media bucket, extend it for supplier, review, lead, analytics, redirect, and GBP data, and keep the public Next.js frontend as a static Vercel deployment consuming Payload at build time. Cut over the existing CMS hostname only after shadow verification, then remove the old Pages/D1 runtime.

**Tech Stack:** Payload 3.88, TypeScript, Next.js, OpenNext Cloudflare, Cloudflare Workers/D1/R2, Vercel static frontend, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-17-payload-cms-full-replacement-design.md`

## Global Constraints

- Preserve public frontend design, URLs, canonical metadata, structured data, sitemap, redirects, and media URLs.
- Do not copy production R2 binary media.
- Do not expose or commit secrets, database exports, screenshots, caches, or generated audit output.
- Do not delete legacy resources until production verification passes.
- Preserve unrelated repository and worktree changes; do not reset, rebase, or force-push.

---

### Task 1: Freeze Baselines And Create One Backup

**Files:**
- Create: `docs/migrations/payload-2026-08-17/baseline.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Cloudflare D1/R2 inventory and current production URLs.
- Produces: timestamped inventory and one external legacy D1 snapshot path.

- [ ] Record git, deployment, D1 table/count/size, R2 object/size, CMS project, and production URL baselines.
- [ ] Export `tung-phat-leads` once to a timestamped file outside the repository.
- [ ] Confirm the backup is non-empty and excluded from Git.
- [ ] Commit only the textual baseline manifest.

### Task 2: Restore And Upgrade The Payload Foundation

**Files:**
- Create: `payload-cms/**`
- Modify: `package.json`, `package-lock.json`, `.gitignore`
- Test: `payload-cms/tests/int/**`

**Interfaces:**
- Consumes: preserved Payload implementation from commit `a01fdb2`.
- Produces: Payload 3.88 application building on Cloudflare Worker/D1/R2.

- [ ] Restore only `payload-cms/` source, tests, migrations, and required assets; exclude screenshots, logs, profiles, and production dumps.
- [ ] Upgrade all Payload packages to exactly 3.88.0 and align supported Next/React/OpenNext versions.
- [ ] Point production media binding to `tung-phat-media` without copying objects.
- [ ] Generate Payload and Cloudflare types.
- [ ] Run Payload integration tests, typecheck, lint, and production build.
- [ ] Commit the upgraded Payload foundation.

### Task 3: Add Complete Collections And Runtime Endpoints

**Files:**
- Create: `payload-cms/src/collections/{Suppliers,Categories,MaterialCodes,Reviews,GbpConnections,Leads,AnalyticsEvents,Redirects}.ts`
- Create: `payload-cms/src/endpoints/**`
- Modify: `payload-cms/src/payload.config.ts`
- Test: `payload-cms/tests/int/**`

**Interfaces:**
- Consumes: normalized supplier records and legacy endpoint response contracts.
- Produces: typed Payload collections and replacement endpoints for forms, analytics, reviews, GBP, media, health, and redirects.

- [ ] Write failing collection-schema and endpoint-contract tests.
- [ ] Implement collections with unique stable keys, relationships, SEO fields, publication state, access control, and timestamps.
- [ ] Implement public read endpoints and protected mutation/sync endpoints.
- [ ] Implement R2 streaming by validated object key with stable cache headers.
- [ ] Implement encrypted GBP token persistence without logging secret values.
- [ ] Run focused tests and commit.

### Task 4: Build Idempotent Migration And Verification

**Files:**
- Create: `payload-cms/scripts/migrate-current-production.ts`
- Create: `payload-cms/scripts/verify-current-production.ts`
- Create: `payload-cms/src/migration/**`
- Test: `payload-cms/tests/int/migration-current.int.spec.ts`

**Interfaces:**
- Consumes: Git content, current supplier JSON, legacy D1 export/API, and R2 object references.
- Produces: repeatable Payload upserts and a deterministic summary with `OLD RECORDS`, `MIGRATED`, `SKIPPED`, `FAILED`, `DUPLICATES REMOVED`, `MEDIA REFERENCES`, and `ORPHAN RECORDS`.

- [ ] Write fixture-based failing tests for reruns, relationships, slugs, SEO, R2 deduplication, skipped garbage, and failure reporting.
- [ ] Implement normalized readers and stable upsert keys.
- [ ] Implement dry-run and production guards.
- [ ] Run migration twice against staging and prove the second run creates no duplicates.
- [ ] Verify source/target counts and require zero unexplained failures.
- [ ] Commit migration tooling.

### Task 5: Adapt Supplier Sync To Payload

**Files:**
- Create: `scripts/catalog-suppliers/payload-client.ts`
- Modify: `scripts/ancuong/**`, `scripts/thanh-thuy/**`, `scripts/ba-thanh/**`, `package.json`
- Test: `tests/supplier-payload-adapter.test.ts`

**Interfaces:**
- Consumes: existing crawler normalization output.
- Produces: batched idempotent Payload supplier/category/material-code/media upserts.

- [ ] Write failing adapter tests for all three suppliers and supplier-specific exclusion rules.
- [ ] Implement authenticated batch upserts with retry, validation, and zero secret logging.
- [ ] Keep existing discovery/crawl/normalize logic unchanged.
- [ ] Run supplier validation and adapter tests.
- [ ] Commit the sync adapter.

### Task 6: Switch Frontend Data And APIs To Payload

**Files:**
- Modify: `lib/content.ts`, `lib/catalog/**`, `components/reviews/GoogleReviews.tsx`, `lib/analytics/client.ts`, `vercel.json`, `public/_headers`, `public/_redirects`, `.env.example`
- Test: `tests/**`, `e2e/**`

**Interfaces:**
- Consumes: Payload published API and compatible runtime endpoints.
- Produces: unchanged public routes/rendering backed by Payload.

- [ ] Add failing parity tests comparing current routes, metadata, structured data, catalogue counts, media URLs, and review response shape.
- [ ] Implement build-time Payload readers with explicit production failure on missing required content.
- [ ] Switch forms, analytics, reviews, and media origins to the Payload CMS hostname.
- [ ] Preserve route, slug, canonical, OG, sitemap, robots, breadcrumb, and redirect behavior.
- [ ] Run unit, integration, build, and local critical E2E.
- [ ] Commit frontend cutover code.

### Task 7: Deploy Shadow, Migrate Production, And Cut Over

**Files:**
- Modify: `payload-cms/wrangler.jsonc`, deployment documentation

**Interfaces:**
- Consumes: verified Payload build, production D1/R2 bindings, Vercel project, and CMS hostname.
- Produces: live Payload production and live frontend consuming it.

- [ ] Deploy the Payload Worker without moving the CMS hostname.
- [ ] Apply production Payload migrations and run the idempotent production data migration.
- [ ] Verify health, counts, media references, admin login, CRUD/publish, supplier sync, reviews, forms, analytics, and GBP sync on the Worker URL.
- [ ] Move `cms.mdftungphat.com` to Payload and verify TLS/DNS/headers.
- [ ] Deploy the frontend to Vercel using the existing workflow.
- [ ] Wait for both deployments to become ready.

### Task 8: Verify Production In Real Browsers

**Files:**
- Create: `docs/migrations/payload-2026-08-17/production-verification.md`

**Interfaces:**
- Consumes: production Payload and mdftungphat.com.
- Produces: evidence-backed PASS/FAIL gate for cleanup.

- [ ] Verify homepage, catalogue, color codes, supplier/category/product pages, search/filter, images/lightbox, 404, sitemap, robots, reviews, and SEO on desktop and mobile.
- [ ] Verify browser console and network contain no unexplained errors, 4xx/5xx, hydration failures, or broken images.
- [ ] Verify Payload login, create/edit/publish, and rollback the test content cleanly.
- [ ] Verify supplier sync and Google Reviews production flows.
- [ ] Record PASS only when every required check succeeds.

### Task 9: Remove Legacy CMS And Infrastructure

**Files:**
- Delete: `cloudflare-cms/**`
- Modify: root configs, scripts, docs, dependencies, env examples, and deployment workflow.

**Interfaces:**
- Consumes: production PASS evidence.
- Produces: Payload as the only CMS and no paid duplicate legacy runtime.

- [ ] Delete legacy CMS code, Decap config, Git gateway, auth, old API routes, migrations, compatibility code, and unused dependencies.
- [ ] Delete legacy Pages projects, preview/staging CMS resources, D1 databases, stale buckets, bindings, secrets, cron routes, and webhooks only after confirming no consumers.
- [ ] Preserve `tung-phat-media` and all non-CMS integrations still used.
- [ ] Remove generated reports, caches, screenshots, dumps, and stale docs from repository tracking/ignore rules.
- [ ] Run a full reference scan proving no legacy CMS runtime references remain.
- [ ] Commit cleanup.

### Task 10: Final Quality Gate, Storage Audit, Git, And Report

**Files:**
- Create: `docs/migrations/payload-2026-08-17/final-report.md`
- Modify: `README.md`, architecture/deployment documentation

**Interfaces:**
- Consumes: cleaned repository and production verification.
- Produces: deployable repository, pushed commits, final before/after storage report.

- [ ] Run root and Payload typecheck, lint, unit, integration, production builds, critical E2E, and `git diff --check`.
- [ ] Recheck production desktop/mobile, console, network, APIs, media, SEO, reviews, supplier sync, and admin CRUD.
- [ ] Measure database, R2, repository, CMS storage, legacy tables, and duplicates before/after and calculate saved storage.
- [ ] Commit logical remaining documentation changes without secrets or artifacts.
- [ ] Push through the existing repository workflow without force operations.
- [ ] Publish the concise final PASS/FAIL report.

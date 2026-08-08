# Tùng Phát Light CMS Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, deploy, migrate, and verify the isolated Tùng Phát Light CMS staging stack on Cloudflare Free while production remains Decap.

**Architecture:** A React/Vite static SPA is deployed to a staging Pages project. A transparent Pages service-binding gateway forwards `/api/*` to a standalone staging Worker that owns D1/R2, authentication, RBAC, content lifecycle, media, versions, audit, preview, and public snapshots. The website consumes a typed snapshot through `CMS_PROVIDER=light` without reading D1 directly.

**Tech Stack:** TypeScript, React 19, Vite, Zod, Cloudflare Workers/Pages/D1/R2, Vitest, Miniflare/Wrangler, Playwright, Axe, Sharp.

## Global Constraints

- Workers Paid activation remains cancelled; no paid subscription or billing mutation.
- All remote resources end in `staging` and are guarded against production names/IDs.
- `cloudflare-cms/` and `payload-cms/` are read-only.
- `CMS_PROVIDER` defaults to `decap`; production is never changed.
- No SSR, ORM, retry masking, shared production bindings, DNS mutation, or custom-domain mutation.
- Remote acceptance requires zero 1102, zero 5xx, p99 CPU `<= 8 ms`, and maximum CPU `<= 9 ms`.
- Work is performed in the user-authorized dirty workspace; no commit, reset, clean, push, or PR.

---

### Task 1: Scaffold contracts and quality tooling

**Files:**
- Create: `light-cms/package.json`
- Create: `light-cms/tsconfig.json`
- Create: `light-cms/vitest.config.ts`
- Create: `light-cms/src/contracts/content.ts`
- Create: `light-cms/src/contracts/api.ts`
- Test: `light-cms/tests/contracts.test.ts`

**Interfaces:**
- Produces `CollectionName`, `ContentStatus`, `collectionSchemas`, `publicSnapshotSchema`, and structured `ApiError` types.

- [ ] Write contract tests for the four collections, five settings, published snapshot filtering, invalid slug, invalid canonical, and required image alt text.
- [ ] Run `npm --prefix light-cms test -- contracts.test.ts` and confirm missing-module failure.
- [ ] Implement the Zod contracts and package tooling.
- [ ] Re-run the contract test and typecheck until green.

### Task 2: Add guarded D1 schema and repository primitives

**Files:**
- Create: `light-cms/migrations/0001_light_cms.sql`
- Create: `light-cms/src/worker/db.ts`
- Create: `light-cms/src/worker/repository.ts`
- Create: `light-cms/scripts/guard-environment.ts`
- Test: `light-cms/tests/repository.test.ts`
- Test: `light-cms/tests/production-guard.test.ts`

**Interfaces:**
- Produces prepared repository operations for summary lists, detail reads, optimistic mutations, versions, restores, settings, media, and audit.

- [ ] Write failing tests proving list queries omit JSON, stale versions cannot write, version/audit rows are transactionally guarded, restore creates a new version, audit is append-only, and non-staging names are rejected.
- [ ] Apply the migration to a real local D1 database and run tests against it.
- [ ] Implement D1 batch mutations using guarded `INSERT ... SELECT` statements.
- [ ] Re-run repository and guard tests until green.

### Task 3: Implement authentication, sessions, CSRF, rate limits, and RBAC

**Files:**
- Create: `light-cms/src/worker/security/crypto.ts`
- Create: `light-cms/src/worker/security/password.ts`
- Create: `light-cms/src/worker/security/session.ts`
- Create: `light-cms/src/worker/security/rate-limit.ts`
- Create: `light-cms/src/worker/security/rbac.ts`
- Test: `light-cms/tests/auth.test.ts`
- Test: `light-cms/tests/rbac.test.ts`

**Interfaces:**
- Produces `hashPassword`, `verifyPassword`, `createSession`, `requireSession`, `requireMutation`, and `authorize`.

- [ ] Write failing tests for non-enumerating login, valid/invalid PBKDF2 hashes, expiry, revoke, fixation resistance, cookie attributes, CSRF, exact origins, lockout, and every role boundary.
- [ ] Run the auth/RBAC tests and confirm expected failures.
- [ ] Implement Web Crypto PBKDF2 with per-user iterations and D1-backed session/rate-limit state.
- [ ] Re-run tests and record local PBKDF2 timings for candidate iteration counts.

### Task 4: Implement Worker API and lifecycle operations

**Files:**
- Create: `light-cms/src/worker/index.ts`
- Create: `light-cms/src/worker/http.ts`
- Create: `light-cms/src/worker/routes/auth.ts`
- Create: `light-cms/src/worker/routes/content.ts`
- Create: `light-cms/src/worker/routes/settings.ts`
- Create: `light-cms/src/worker/routes/dashboard.ts`
- Create: `light-cms/src/worker/routes/versions.ts`
- Create: `light-cms/src/worker/routes/audit.ts`
- Create: `light-cms/src/worker/routes/preview.ts`
- Create: `light-cms/src/worker/routes/public.ts`
- Test: `light-cms/tests/worker.integration.test.ts`
- Test: `light-cms/tests/security.test.ts`

**Interfaces:**
- Produces the documented `/api/auth`, collection CRUD, settings, dashboard, versions, restore, audit, preview, and public snapshot endpoints.

- [ ] Write failing integration/security tests for request IDs, pagination, validation, SQL injection, XSS-safe JSON, draft isolation, metadata leakage, CORS, headers, optimistic conflicts, authorization, and no 5xx on invalid input.
- [ ] Implement the explicit router and handlers with bounded request/response bodies.
- [ ] Exercise the real local D1 through Wrangler/Miniflare, not a fully mocked Worker.
- [ ] Re-run integration and security tests until green.

### Task 5: Implement streamed R2 media lifecycle

**Files:**
- Create: `light-cms/src/worker/routes/media.ts`
- Create: `light-cms/src/worker/media/mime.ts`
- Create: `light-cms/src/worker/media/stream.ts`
- Test: `light-cms/tests/media.integration.test.ts`

**Interfaces:**
- Produces pending metadata creation, original/thumbnail upload, ready-state listing/read, deletion, and orphan cleanup.

- [ ] Write failing tests for pending invisibility, 15 MB enforcement, missing length, MIME spoofing, magic bytes, traversal, remote URLs, R2 HEAD verification, alt text, and orphan cleanup.
- [ ] Implement prefix inspection plus reconstructed streaming upload without buffering the complete file.
- [ ] Run tests with a real local R2 binding and verify incomplete uploads remain private.
- [ ] Re-run tests until green.

### Task 6: Build Bright Tùng Phát React/Vite admin

**Files:**
- Create: `light-cms/index.html`
- Create: `light-cms/vite.config.ts`
- Create: `light-cms/src/admin/main.tsx`
- Create: `light-cms/src/admin/app.tsx`
- Create: `light-cms/src/admin/api.ts`
- Create: `light-cms/src/admin/styles.css`
- Create: `light-cms/src/admin/components/*`
- Create: `light-cms/src/admin/screens/*`
- Create: `light-cms/public/fonts/*`
- Test: `light-cms/tests/admin.test.tsx`
- Test: `light-cms/e2e/admin.spec.ts`

**Interfaces:**
- Produces the complete Vietnamese admin SPA with code-split routes and schema-driven editors.

- [ ] Write failing component/E2E tests for login, dashboard, lists, editors, media, settings, users, versions, audit, preview, loading/error/empty states, dialogs, unsaved changes, mobile navigation, and keyboard focus.
- [ ] Implement semantic accessible components and route-level lazy loading.
- [ ] Copy the existing local Montserrat assets into the isolated app and implement the approved forest/white/light-green/orange design tokens.
- [ ] Run unit, Playwright, Axe, responsive, reduced-motion, and bundle budget checks until green.

### Task 7: Implement and verify the same-origin gateway

**Files:**
- Create: `light-cms/functions/api/[[path]].ts`
- Create: `light-cms/wrangler.pages.jsonc`
- Test: `light-cms/tests/gateway.test.ts`

**Interfaces:**
- Consumes the `LIGHT_CMS_API` service binding and produces transparent same-origin `/api/*` behavior.

- [ ] Write failing tests proving method/body/cookie forwarding, status/header/Set-Cookie preservation, no cache, no retry, and exact 1102/5xx propagation.
- [ ] Implement the gateway as one streaming service-binding fetch.
- [ ] Verify local cookie, CSRF, CORS, and cache behavior through Pages dev.
- [ ] Re-run gateway tests until green.

### Task 8: Add migration and verification scripts

**Files:**
- Create: `light-cms/scripts/analyze-source.ts`
- Create: `light-cms/scripts/migrate-to-light-cms.ts`
- Create: `light-cms/scripts/verify-light-cms.ts`
- Test: `light-cms/tests/migration.test.ts`

**Interfaces:**
- Produces dry-run-default JSON/Markdown analysis, migration, and verification reports.

- [ ] Write failing tests for 12 records, five settings, nine media, checksums, relationships, duplicate detection, orphan detection, missing files, dry-run, and second-run idempotency.
- [ ] Implement source analysis against Decap with Payload as read-only parity evidence.
- [ ] Implement guarded staging apply through Wrangler D1/R2 commands.
- [ ] Re-run migration tests and local apply/verify twice until green.

### Task 9: Add the website Light provider and three-way parity

**Files:**
- Modify: `lib/cms-provider.ts`
- Modify: `lib/content.ts`
- Create: `tests/light-cms-provider.test.ts`
- Create: `light-cms/scripts/provider-parity.ts`

**Interfaces:**
- Produces `CMS_PROVIDER=light` while keeping invalid/missing values on Decap.

- [ ] Write failing tests for default Decap, typed Light snapshot validation, checksum failure, draft exclusion, and normalization into existing website schemas.
- [ ] Implement a single build-time snapshot reader/fetcher and no direct D1 dependency.
- [ ] Run Decap/Payload/Light data and rendered parity locally.
- [ ] Confirm no production environment or deployment mutation.

### Task 10: Provision and deploy isolated staging resources

**Files:**
- Create: `light-cms/wrangler.worker.jsonc`
- Create: `light-cms/scripts/deploy-staging.ts`
- Create: `light-cms/scripts/verify-staging-resources.ts`

**Interfaces:**
- Produces Pages `tungphat-light-cms-staging`, Worker `tungphat-light-cms-api-staging`, D1 `tungphat-light-cms-staging`, and R2 `tungphat-light-media-staging`.

- [ ] Verify current billing `$0.00`, Workers Free, and absence of target resources.
- [ ] Create only the four named staging resources and record their IDs.
- [ ] Apply migration, create secrets and bootstrap a temporary strong super-admin without printing credentials.
- [ ] Deploy Worker and Pages, then verify health, gateway, D1/R2 bindings, cookies, CSRF, CORS, and no production mutation.

### Task 11: Migrate staging and run remote acceptance

**Files:**
- Create: `light-cms/scripts/remote-e2e.ts`
- Create: `light-cms/scripts/security-check.ts`
- Create: `light-cms/scripts/accessibility-check.ts`

**Interfaces:**
- Produces remote migration, idempotency, E2E, security, accessibility, and cleanup evidence.

- [ ] Apply migration to staging, verify 12 records/five settings/nine media, and run a second idempotent apply.
- [ ] Run remote role, CRUD, draft/publish/unpublish, version/restore, preview, media, public API, and error-state E2E.
- [ ] Run the complete security matrix and Axe at 1440, 1024, 768, and 390 px.
- [ ] Remove all test fixtures and verify the migrated baseline remains intact.

### Task 12: Run PBKDF2 calibration and full Free-plan benchmark

**Files:**
- Create: `light-cms/scripts/benchmark-pbkdf2.ts`
- Create: `light-cms/scripts/benchmark-staging.ts`
- Create: `light-cms/scripts/parse-tail.ts`

**Interfaces:**
- Produces candidate KDF comparison and per-route cold/warm CPU/latency/error reports from real Worker tail events.

- [ ] Benchmark multiple PBKDF2 iteration counts through real login flows and select the highest secure count within the CPU gate.
- [ ] Deploy the selected policy, re-bootstrap the staging password hash, and re-run auth/security tests.
- [ ] Run the full required request mix, collect Worker tail, and calculate CPU p50/p95/p99/max, wall p50/p95/p99, response bytes, D1 query counts, errors, and 1102.
- [ ] Fail acceptance on any 5xx, 1102, p99 above 8 ms, max above 9 ms, insufficient samples, or mocked dependency.

### Task 13: Final verification and reports

**Files:**
- Create: `docs/free-light-cms/IMPLEMENTATION_REPORT.md`
- Create: `docs/free-light-cms/SECURITY_REVIEW.md`
- Create: `docs/free-light-cms/BENCHMARK_REPORT.md`
- Create: `docs/free-light-cms/MIGRATION_REPORT.md`
- Create: `docs/free-light-cms/PROVIDER_PARITY_REPORT.md`
- Create: `docs/free-light-cms/STAGING_DEPLOYMENT_REPORT.md`
- Create: `docs/free-light-cms/STAGING_ROLLBACK_RUNBOOK.md`

**Interfaces:**
- Produces the evidence-backed final staging verdict.

- [ ] Run full lint, typecheck, unit/integration/local-real/E2E/Axe/security/migration/parity/benchmark/secret/bundle suites and `git diff --check`.
- [ ] Re-query Payload D1 and all nine media checksums read-only.
- [ ] Re-check production Decap/website health, Workers plan, billing, subscriptions, DNS non-mutation, and staging cleanup.
- [ ] Write reports with exact commands/results and declare only `LIGHT CMS STAGING ACCEPTANCE PASSED` or `LIGHT CMS STAGING BLOCKED`.

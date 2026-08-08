# Free Lightweight CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Decap editor with a static, Vietnamese admin SPA and a minimal D1/R2 API that remains safely inside Workers Free limits while preserving Decap as the rollback provider.

**Architecture:** Keep `cms.mdftungphat.com` on the existing Cloudflare Pages surface, but replace only the admin frontend after a separate Decap fallback project is verified. The SPA is static Preact/Vite output; Pages Functions expose narrow D1/R2 endpoints, reuse GitHub OAuth plus signed HttpOnly sessions, and never run SSR, an ORM or password hashing on the request hot path. The public website continues on Decap until the new provider passes data/render parity and the same Free-plan CPU gate measured by the benchmark.

**Tech Stack:** TypeScript, Preact, Vite, Cloudflare Pages Functions, Workers runtime, D1, R2, GitHub OAuth, Vitest, Playwright, Wrangler tail.

## Global Constraints

- Workers plan remains Free; no subscription or paid feature activation.
- Decap remains production and rollback until every new-CMS gate passes.
- Never delete Payload D1/R2, Decap source/media, Quote resources, backups or migration reports.
- No SSR, ORM, N+1 query, unbounded JSON/body buffering, runtime framework import or password KDF on API requests.
- Every API route must have p99 CPU at most `5 ms`, maximum below `10 ms`, and zero `exceededCpu`/`1102` in the final remote soak.
- D1 list queries cap at `50` rows and select only required fields; mutations use optimistic `version` checks.
- R2 uploads stream, use an allowlist, cap at `15 MB`, and store metadata separately in D1.
- Authentication, CSRF, CORS, RBAC, draft isolation and audit history may not be weakened.
- Production cutover must automatically restore Decap and `CMS_PROVIDER=decap` on any acceptance failure.

---

### Task 1: Preserve a standalone Decap rollback surface

**Files:**
- Create: `cloudflare-cms/scripts/verify-decap-fallback.mjs`
- Create: `cloudflare-cms/docs/DECAP_FALLBACK_BASELINE.md`
- Modify: `cloudflare-cms/package.json`
- Test: `e2e-cms/decap-fallback.spec.ts`

**Interfaces:**
- Consumes: current `cloudflare-cms/public/` production artifact.
- Produces: `npm run verify:decap-fallback` and a Pages fallback URL that is independent of the future light-admin deployment.

- [ ] Write an E2E test that requires HTTP 200, the login form, pinned Decap script, `config.yml`, expected 401 session behavior and no console/page errors except the expected unauthenticated 401.
- [ ] Run the test against a nonexistent fallback URL and confirm it fails.
- [ ] Deploy an immutable copy of `cloudflare-cms/public/` to a new Pages project named `tungphat-decap-fallback` without attaching a custom domain.
- [ ] Implement `verify-decap-fallback.mjs` to check HTML SHA-256, critical assets, security headers and the Pages deployment ID.
- [ ] Run E2E on desktop/mobile and record the rollback URL/deployment in `DECAP_FALLBACK_BASELINE.md`.
- [ ] Commit only the verifier, tests and documentation; never commit credentials.

### Task 2: Build the narrow D1/R2 content API

**Files:**
- Create: `cloudflare-cms/migrations/0010_light_cms_content.sql`
- Create: `cloudflare-cms/src/content/types.ts`
- Create: `cloudflare-cms/src/content/validation.ts`
- Create: `cloudflare-cms/src/content/repository.ts`
- Create: `cloudflare-cms/src/content/handler.ts`
- Create: `cloudflare-cms/functions/api/content/[[path]].ts`
- Create: `cloudflare-cms/functions/api/media/[[path]].ts`
- Test: `cloudflare-cms/tests/content.test.ts`
- Test: `cloudflare-cms/tests/content-security.test.ts`

**Interfaces:**
- Consumes: existing `verifySession`, `validMutation`, D1 `DB` and R2 `MEDIA` bindings.
- Produces: `listContent(type, limit, cursor)`, `getContent(id)`, `updateContent(id, input, expectedVersion)`, `publishContent(id, expectedVersion)` and streamed media handlers.

- [ ] Write failing tests for unauthenticated access, exact-origin CORS, CSRF, role denial, draft leakage, invalid IDs, 64 KB JSON limit, 15 MB media limit, MIME allowlist, version conflicts and audit entries.
- [ ] Add normalized tables for content, versions, media metadata, content-media relations, audit events and an outbox; add only the indexes used by list/detail/version queries.
- [ ] Implement repository calls with prepared statements, field selection, `LIMIT <= 50`, no relationship loop and a single optimistic update statement.
- [ ] Implement handlers that return bounded JSON and stream R2 bodies without converting media to strings or arrays.
- [ ] Reuse GitHub OAuth and signed sessions; do not call Argon2/password verification from authenticated API requests.
- [ ] Run `npm --prefix cloudflare-cms test`, lint, typecheck and Wrangler dry-run.

### Task 3: Build the static admin SPA

**Files:**
- Create: `cloudflare-cms/light-admin/package.json`
- Create: `cloudflare-cms/light-admin/vite.config.ts`
- Create: `cloudflare-cms/light-admin/src/main.tsx`
- Create: `cloudflare-cms/light-admin/src/api.ts`
- Create: `cloudflare-cms/light-admin/src/screens/ContentList.tsx`
- Create: `cloudflare-cms/light-admin/src/screens/ContentEditor.tsx`
- Create: `cloudflare-cms/light-admin/src/screens/MediaLibrary.tsx`
- Create: `cloudflare-cms/light-admin/src/screens/Preview.tsx`
- Test: `e2e-cms/light-admin.spec.ts`

**Interfaces:**
- Consumes: Task 2 JSON endpoints and current `/auth`, `/callback`, `/api/auth/session`, `/api/auth/logout` flows.
- Produces: static assets only; no server components or SSR routes.

- [ ] Write failing Playwright tests for login, collection list, draft edit, conflict recovery, media upload, preview, publish, logout, keyboard navigation and mobile layout.
- [ ] Build a Preact SPA with route-level code splitting and no admin dependency in the Worker bundle.
- [ ] Keep editor state local, autosave only after explicit debounce, and send `version` plus CSRF on every mutation.
- [ ] Add accessible validation summaries, unsaved-change confirmation and Vietnamese empty/loading/error states.
- [ ] Enforce bundle budgets: initial JS gzip `<= 80 KB`, each lazy route gzip `<= 40 KB`, zero source maps in production Pages output.
- [ ] Run lint, typecheck, unit tests, Playwright, Axe and bundle-size checks.

### Task 4: Add the website light-CMS provider without changing production

**Files:**
- Create: `lib/light-cms-client.ts`
- Modify: `lib/cms-provider.ts`
- Modify: `lib/content.ts`
- Create: `tests/light-cms-provider.test.ts`
- Create: `scripts/compare-light-provider.mjs`

**Interfaces:**
- Consumes: a single versioned `GET /api/public/snapshot` response with ETag, published records and media URLs.
- Produces: provider value `light`; absent/invalid values still resolve to `decap`.

- [ ] Write failing tests proving Decap remains the default and malformed/unavailable light-CMS data fails the build instead of silently publishing partial content.
- [ ] Implement one build-time snapshot fetch, schema validation and immutable normalization into the existing `ContentRepository` facade.
- [ ] Add ETag/checksum evidence to build logs without printing secrets or draft data.
- [ ] Compare all public routes, visible content, SEO, canonical, structured data, sitemap, images and alt text against Decap.
- [ ] Deploy only a protected Vercel preview with `CMS_PROVIDER=light`; do not promote it.

### Task 5: Migrate and verify content while Decap stays authoritative

**Files:**
- Create: `cloudflare-cms/scripts/migrate-decap-to-light.ts`
- Create: `cloudflare-cms/scripts/verify-light-migration.ts`
- Create: `cloudflare-cms/docs/LIGHT_CMS_MIGRATION_RUNBOOK.md`
- Test: `cloudflare-cms/tests/light-migration.test.ts`

**Interfaces:**
- Consumes: current Decap Git source plus media manifest.
- Produces: idempotent D1 upserts, R2 uploads, source checksums and a zero-issue verification report.

- [ ] Write failing tests for duplicate slugs, missing media, draft/publish mismatch, SEO mismatch and second-run creates.
- [ ] Export and checksum Decap source before any remote apply.
- [ ] Apply migration only to dedicated light-CMS staging D1/R2.
- [ ] Require counts `12` content and `9` media unless a fresh source delta report proves a legitimate change.
- [ ] Require second migration run to create `0` records and media SHA-256 to pass for every object.
- [ ] Keep Payload data untouched and record it only as an independent preserved archive.

### Task 6: Prove Workers Free capacity and security

**Files:**
- Modify: `cloudflare-cms/benchmarks/free-cms-worker/src/index.ts`
- Create: `cloudflare-cms/scripts/profile-light-cms.ts`
- Create: `cloudflare-cms/scripts/soak-light-cms.ts`
- Create: `cloudflare-cms/docs/LIGHT_CMS_FREE_GATE.md`

**Interfaces:**
- Consumes: staging API, test admin session and the route list from Tasks 2-3.
- Produces: per-route cold/warm CPU p50/p95/p99/max, outcome counts, latency, D1/R2 usage and a pass/fail gate.

- [ ] Run cold samples after ten fresh versions and warm samples of at least `1,000` requests per route.
- [ ] Exercise session, list, detail, draft create/update, publish, version restore, preview, R2 HEAD/GET/PUT and logout.
- [ ] Tail every run and fail on any non-`ok` outcome, `1102`, CPU maximum `>= 10 ms`, p99 `> 5 ms`, memory error or incorrect response.
- [ ] Run a 60-minute soak at realistic concurrency with no retry masking.
- [ ] Run CORS, CSRF, RBAC, IDOR, draft leakage, traversal, MIME, size, upload and secret/bundle scans.
- [ ] Record comparison against the prototype baseline: startup `4 ms`, observed route max `1 ms`, zero `1102`.

### Task 7: Cut over with automatic rollback

**Files:**
- Create: `cloudflare-cms/scripts/light-cms-cutover.mjs`
- Create: `cloudflare-cms/scripts/light-cms-rollback.mjs`
- Create: `cloudflare-cms/docs/LIGHT_CMS_CUTOVER_RUNBOOK.md`
- Test: `e2e-cms/light-production-acceptance.spec.ts`

**Interfaces:**
- Consumes: verified Decap fallback deployment, light admin Pages deployment, provider parity report and Free gate.
- Produces: reversible Pages deployment switch followed by reversible Vercel provider promotion.

- [ ] Verify billing is `$0.00`, Workers remains Free, Decap fallback is HTTP 200 and all data checksums pass immediately before cutover.
- [ ] Promote the light admin static Pages deployment to the existing CMS project without changing DNS or nameservers.
- [ ] Run login, session, content CRUD, preview, upload, logout, CORS, console, 404, 5xx, desktop/mobile and Axe acceptance.
- [ ] On any failure, immediately redeploy the recorded Decap artifact to the CMS Pages project.
- [ ] Only after CMS stability, promote the protected website preview with `CMS_PROVIDER=light`.
- [ ] Run the full website matrix; on any mismatch or 5xx, immediately redeploy with `CMS_PROVIDER=decap`.
- [ ] Declare success only with zero paid subscription, zero `1102`, billing `$0.00`, Decap fallback HTTP 200 and all production health gates passing.

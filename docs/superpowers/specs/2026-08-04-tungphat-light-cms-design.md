# Tùng Phát Light CMS staging design

## Objective

Build an isolated, staging-only CMS that runs on Cloudflare Free resources without Payload Admin SSR. The deliverable is a static React/Vite admin SPA on Pages, a small Worker API, a dedicated D1 database, and a dedicated R2 bucket. Decap remains the production CMS and website provider throughout this project.

## Immutable constraints

- Never activate Workers Paid, create a paid subscription, or accept billing terms.
- Never mutate production DNS, custom domains, Decap, Payload, Quote, lead, or analytics resources.
- Never deploy the Light CMS as the production website provider in this session.
- Every new remote resource name ends in `staging`.
- The API has no SSR, ORM, React runtime, retry masking, or fail-open fallback.
- Acceptance requires zero 1102, zero 5xx, p99 CPU at most 8 ms, and maximum CPU at most 9 ms on the real staging Worker.

## Repository boundary

Create a top-level `light-cms/` application with focused modules:

- `src/contracts/`: Zod schemas and shared API types.
- `src/worker/`: router, authentication, RBAC, content, settings, media, versions, audit, preview, public API, and security helpers.
- `src/admin/`: React SPA, screens, form schemas, accessible components, API client, and styles.
- `functions/api/[[path]].ts`: transparent Pages service-binding gateway.
- `migrations/`: D1 schema.
- `scripts/`: analysis, migration, verification, deployment guards, remote benchmark, and report generation.
- `tests/`: unit, Worker integration, D1/R2 local-real, migration, security, provider parity, and benchmark contract tests.

Only the website abstraction files `lib/cms-provider.ts`, `lib/content.ts`, and their tests may be updated outside this boundary. `cloudflare-cms/` and `payload-cms/` are read-only inputs.

## Runtime architecture

The Pages project serves only static Vite assets plus a tiny `/api/*` gateway. The gateway forwards the original method, headers, cookies, and streaming body to the `LIGHT_CMS_API` service binding. It returns the upstream status, headers, cookies, and streaming body unchanged. It never retries, catches 1102 into 200, caches authenticated traffic, or implements business logic.

The API Worker owns authentication, authorization, validation, D1/R2 access, structured errors, security headers, and request IDs. Admin routes are accessible through the gateway. The public published endpoint is also available directly from the Worker for website builds and parity checks.

## D1 model

`content_records` stores collection, slug, title, status, summary fields, timestamps, optimistic `version`, and `content_json`. List queries select summary columns only. Detail queries read `content_json` and validate it against the matching collection schema.

`settings_records` stores the five approved globals with the same version discipline. Operational tables are `users`, `sessions`, `login_attempts`, `versions`, `audit_logs`, `media`, and `preview_tokens` if one-time revocation is required.

Mutations use optimistic version checks. D1 `batch()` groups the content/settings mutation, new version snapshot, and audit insert. Inserts for version/audit use `INSERT ... SELECT` guarded by the new version, so a stale update produces no side records. Restore creates a new current version and never removes historical versions. Delete is a soft delete to preserve auditability and rollback.

Version retention defaults to the newest 30 snapshots per record. Retention cleanup never removes the current restore source during the mutation that created it.

## Content contract

Collections are exactly Products, Articles, Projects, Pages, Media, Users, Sessions, Versions, and Audit Logs. Settings are exactly Business Settings, SEO Defaults, Static Pages, Material Categories, and Brands.

Public output contains only non-deleted `published` records and public settings. It excludes user IDs, internal D1 IDs, lockout state, sessions, audit metadata, R2 object keys, pending media, version counters, and drafts. The public snapshot is schema-versioned, checksummed, cacheable with ETag, and Zod-validated by the website provider.

## Authentication and RBAC

Passwords use Web Crypto PBKDF2-HMAC-SHA256 with per-user 16-byte salts and 32-byte derived keys. Iteration count is stored in each hash. Staging benchmarks multiple candidate counts through real login requests and Worker tail CPU. The highest count meeting the CPU gate is selected, but no count below the documented security floor is accepted. If the floor cannot meet Workers Free, staging acceptance is blocked rather than weakening authentication.

Sessions use random opaque IDs, store only SHA-256 hashes in D1, expire after 12 hours, and are revokeable. Cookies are HttpOnly, Secure remotely, SameSite=Lax through the same-origin gateway, host-only, and Path `/`. Mutations require the session plus an exact CSRF header and allowed Origin. Login responses do not reveal account existence. Rate limiting combines a hashed client key with username and uses bounded windows plus account lockout. Passwords, cookies, tokens, and full content bodies are never logged.

Roles:

- `super-admin`: all operations, user management, role changes, restore, publish, delete, and audit read.
- `admin`: content/settings/media CRUD, publish/unpublish, restore, versions, preview, and audit read; no role escalation or super-admin deletion.
- `editor`: read all admin content, create/update drafts, media upload, versions read, and preview; no publish, restore, delete, settings security changes, user management, or audit access.

## Media flow

`POST /api/media` accepts bounded JSON metadata and creates a private `pending` row with a random object key. `PUT /api/media/:id/file` accepts the raw body, validates declared size, MIME allowlist, filename, path safety, and magic bytes from a small prefix, then streams the reconstructed body to R2. It verifies the resulting object with R2 HEAD before marking the row `ready`. Pending rows are never public.

Images receive a client-generated WebP thumbnail uploaded to a separate endpoint; migration uses local Sharp to generate equivalent thumbnails. A scheduled staging cleanup removes expired pending rows and unreferenced test/orphan objects after verification. Remote URL upload is not supported. Maximum original size is 15 MB.

## Preview

Authenticated users request a short-lived HMAC preview token scoped to collection, record ID, version, and expiry. The token is not stored in localStorage. Preview endpoints validate signature, expiry, record version, and permissions, then return only the requested draft. Public APIs never accept draft flags.

## Admin SPA

The Bright Tùng Phát Admin uses local Montserrat, forest green, white and pale green surfaces, orange focus accents, thin borders, low shadows, and a bright paper-like background. It has a compact sidebar, low header, wide editors, one clear primary action per screen, and no Decap/Payload CSS dependency.

The SPA provides login, dashboard with real counts, four collection lists/editors, media library, Business Settings, SEO Defaults, users, versions, audit logs, preview, loading, error, empty, and confirmation states. Vietnamese labels and descriptions come from a schema-driven field registry. Editors provide autoslug, inline validation, required alt text, draft/publish/unpublish, version restore, unsaved-change warning, and delete confirmation.

Routes are code-split. The initial bundle target is at most 120 KB gzip and no single lazy screen exceeds 60 KB gzip. No heavy rich-text framework is included; Markdown uses a lightweight textarea with formatting helpers and preview.

## Website provider

`CMS_PROVIDER` accepts `decap`, `payload`, or `light`; missing and invalid values remain `decap`. The Light provider consumes one build-time snapshot, validates it with Zod, checks schema version/checksum, and normalizes it through the existing website content facade. The website never reads D1 directly.

Provider parity compares Decap, Payload, and Light counts, slugs, content, SEO, canonical, Open Graph, images, alt text, internal links, structured data, fallback, and cache behavior. No production environment variable is changed.

## Migration

`scripts/analyze-source.ts`, `scripts/migrate-to-light-cms.ts`, and `scripts/verify-light-cms.ts` use Decap as the authoritative source and Payload as an independent parity archive. Dry-run is the default. Remote writes require explicit `--apply --environment staging` plus resource guards.

Migration preserves slug, title, Markdown, SEO, draft/published state, relationships, media mapping, and settings. It emits JSON and Markdown reports with checksums, duplicates, missing files, orphans, and every non-applied record. A second apply creates zero duplicate records and uploads zero duplicate media objects.

## Verification and acceptance

Local gates include unit, integration, real local D1/R2, auth, RBAC, migration, idempotency, provider parity, E2E, Axe, security, secret scan, bundle scan, and `git diff --check`.

Remote benchmark covers the required request mix: 300 authenticated requests, 200 public requests, 50 login/logout flows, 50 draft saves, 20 publish/unpublish operations, 20 restores, 20 media metadata operations, and 10 small uploads. Worker tail evidence records cold/warm CPU, p50/p95/p99/max, wall time, response size, D1 query count, errors, and 1102 count per route.

Acceptance is `LIGHT CMS STAGING ACCEPTANCE PASSED` only when Pages, gateway, Worker, D1, R2, migration, parity, accessibility, security, and benchmark gates all pass while billing remains `$0.00` and production remains Decap. Any unmet gate produces `LIGHT CMS STAGING BLOCKED` with exact evidence.

# Tùng Phát Light CMS baseline audit

- Audit date: `2026-08-04`
- Repository HEAD: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Cloudflare account: `b9ae472cee29c5729ee90ccbb3533f33`
- Production CMS and website provider: `decap`
- Scope: read-only verification of the repository, the prototype benchmark, existing Cloudflare resources, production health, Payload preservation, and billing state.

## Fixed safety boundary

```text
PRODUCTION CUTOVER BLOCKED

Workers Paid activation: CANCELLED
Additional paid subscription: NONE
CMS production: DECAP
Website CMS provider: DECAP
Website production health: PASS
Payload data preserved: YES
Production billing mutation: NONE
```

No production provider, DNS, nameserver, subscription, database, R2 object, or deployment was mutated during this audit.

## Repository state

The worktree was already dirty before this session. It includes modified Decap files, website integration changes, the complete untracked `payload-cms/` tree, benchmark files, reports, output artifacts, and Quote application files. These changes are treated as user-owned and must not be reset, cleaned, or overwritten casually.

The website integration currently supports only:

```text
CMS_PROVIDER=decap
CMS_PROVIDER=payload
```

`lib/cms-provider.ts` defaults invalid or missing values to `decap`. `lib/content.ts` reads Decap Markdown directly and reads a local Payload public snapshot through the same website schemas. There is no `light` provider, no Light CMS Zod snapshot contract, and no Light CMS parity test yet.

The existing Cloudflare CMS Pages project binds production lead/analytics resources:

- D1 `tung-phat-leads` through binding `DB`.
- R2 `tung-phat-media` through binding `MEDIA`.

Those bindings belong to the existing Decap/lead/analytics surface and are explicitly out of scope for the new CMS. Light CMS requires its own Worker, D1, R2, and Pages project.

## Source content model

Fresh filesystem counts match the recorded migration baseline:

| Collection | Decap source | Payload production | Public Payload |
|---|---:|---:|---:|
| Products | 6 | 6 | 6 |
| Articles | 3 | 3 | 0 |
| Projects | 1 | 1 | 0 |
| Pages | 2 | 2 | 2 |
| Total content | 12 | 12 | 8 |
| Media | 9 referenced | 9 | 9 readable |

The settings source contains exactly five files/contracts:

- `content/settings/business.json` -> Business Settings.
- `content/settings/seo.json` -> SEO Defaults.
- `content/settings/static-pages.json` -> Static Pages.
- `content/categories/materials.json` -> Material Categories.
- `content/categories/brands.json` -> Brands.

The Decap configuration, Payload collections/globals, website Zod schemas, and migrated records agree on the required public model: Products, Articles, Projects, Pages, Media, Business Settings, SEO Defaults, Static Pages, Material Categories, and Brands. Users, Sessions, Versions, and Audit Logs are Light CMS operational collections and must remain server-private except for role-appropriate admin views.

Payload has one additional product availability value, `guide`, while the current website schema accepts only `available` and `discontinued`. The Light CMS contract must preserve current website compatibility and must not publish `guide` until the website schema and rendering contract explicitly support it.

## Payload preservation verification

A fresh read-only D1 query against `tungphat-payload-cms` returned:

```text
products=6
articles=3
projects=1
pages=2
media=9
rows_written=0
```

All nine media objects were fetched from the Payload shadow Worker and recomputed with SHA-256. Each returned HTTP 200 and matched `payload-cms/output/migration/production-verification.json` (`9/9 PASS`). Payload remains shadow-only and is not the production CMS runtime.

## Cloudflare and production verification

- Wrangler is authenticated as `nkhaduy@gmail.com` on account `b9ae472cee29c5729ee90ccbb3533f33`.
- Workers dashboard shows `Free` as the current plan at `$0`; the Free CPU limit shown is `10 ms/request`.
- Billing for the current cycle shows total cost `$0.00`, projected cycle cost `$0.00`, average daily cost `$0.00`, and no billable R2 usage.
- The account has an existing `R2 Paid` service listed at `$0.00/mo plus usage`; this audit did not create, upgrade, activate, or alter any subscription. "Additional paid subscription: NONE" refers to no new subscription caused by this work.
- `https://cms.mdftungphat.com` returned HTTP 200 and still serves Decap.
- `https://tungphat-cms.pages.dev` returned HTTP 200 and still serves the Decap fallback.
- `https://mdftungphat.com` returned HTTP 200 and remains on the Decap-backed production deployment.
- No Light CMS staging Pages project, Worker, D1 database, or R2 bucket exists yet.

## Prototype benchmark audit

### What was measured

The Worker `tungphat-light-cms-benchmark` uses the real remote D1 database and R2 bucket of the same name. It measured:

- `GET /health`.
- `GET /api/session` after a fixed bearer-token digest check.
- `GET /api/content?type=...` against one indexed D1 table.
- `GET /api/content/:id`.
- `PUT /api/content/:id` with title/body validation and optimistic version update.
- `HEAD`, `GET`, and `PUT /api/media/:key` against real R2.
- JSON serialization of small list/detail/update responses.

The retained result reports 80 functional warm requests, 24 tail-confirmed requests, 21 captured tail events, aggregate p99/max CPU `1 ms`, zero `exceededCpu`, and zero `1102`.

### What was not measured

- No username/password login or password KDF.
- No secure cookie creation, D1 session persistence, revocation, expiry, or logout flow.
- No CSRF, origin allowlist, CORS response policy, or request ID.
- No real users table or `super-admin`/`admin`/`editor` RBAC.
- No account lockout or login rate limiting.
- No content creation, deletion, publish, unpublish, dashboard summary, or public published snapshot.
- No article-specific workload.
- No versions, restore transaction, retention, or audit log writes.
- No preview token signing or verification.
- No media metadata table, alt text, uploader metadata, orphan detection, or cleanup.
- No MIME signature verification; `application/octet-stream` is accepted by the prototype.
- No 15 MB boundary; prototype uploads are capped at 1 MB.
- No streamed body-size enforcement when `Content-Length` is missing or false.
- No cold-version sampling, concurrency profile, login/logout flows, realistic content payloads, or required request mix.
- No explicit D1 query count, response-size report, per-route p50/p95/p99 sample set, or fixture cleanup evidence.
- No unit, integration, security, migration, parity, E2E, or accessibility gate around the prototype.

### Representativeness conclusion

The `1 ms` maximum is credible for the exact narrow proof-of-concept endpoints because they use real D1/R2 and real Worker tail events. It is not representative evidence for a production-ready CMS. The implementation omits most CPU-sensitive and write-amplifying paths, especially password verification, session persistence, version snapshots, audit writes, restore transactions, validation of real record shapes, and realistic authenticated load.

Reusable parts are limited to architectural techniques:

- Static frontend separated from the Worker runtime.
- Small route dispatcher with no SSR, ORM, or framework runtime.
- Prepared D1 statements with bounded list queries.
- Optimistic version checks.
- Streaming R2 request/response bodies.
- Constant-time token comparison.
- Full Worker observability sampling during benchmark runs.

The prototype schema, bearer authentication, record model, validation, and benchmark driver must not be treated as production code.

## Existing authentication code assessment

The Decap Pages Functions already contain useful session, CSRF, origin, lockout, and structured-response code, but the current password path uses synchronous Argon2id with about 19 MiB memory. That implementation is not proven safe under the Workers Free `10 ms` CPU limit and supports only one environment-configured admin identity rather than D1-backed users and RBAC.

The Payload shadow includes a Web Crypto PBKDF2 compatibility layer at 25,000 rounds. The new CMS should benchmark a Web Crypto password KDF on the actual staging Worker before choosing parameters. Authentication must retain non-enumerating errors, server-side rate limiting, revokeable D1 sessions, HttpOnly cookies, CSRF protection, and server-side roles.

## Design-system findings

The Quote application provides the stronger visual baseline for Bright Tùng Phát Admin: local Montserrat, forest green, white/light-green surfaces, orange focus accents, compact navigation, low-shadow bordered panels, responsive wide editors, and explicit reduced-motion handling. Payload provides useful content-editor information architecture, labels, descriptions, preview breakpoints, and empty/loading/error patterns.

The new SPA should reuse tokens and interaction principles, not copy Quote business logic, Quote bindings, Decap CSS overrides, or Payload components/runtime.

## Baseline verdict

```text
FREE CMS PROTOTYPE: ARCHITECTURE CANDIDATE ONLY
LIGHT CMS STAGING: NOT YET CREATED
PRODUCTION PROVIDER: DECAP
PAYLOAD DATA: PRESERVED
WORKERS PLAN: FREE
NEW PAID SUBSCRIPTION: NONE
PRODUCTION MUTATIONS: NONE
```

The next gate is an approved implementation design and plan that removes the old plan's production-cutover task, uses an isolated React/Vite SPA plus standalone Worker API, and covers the full required benchmark, migration, parity, security, accessibility, and rollback evidence.

## Access identity addendum — 2026-08-06

The password/PBKDF2 staging request path has been replaced locally by a Cloudflare Access identity integration. PBKDF2 remains isolated for rollback and is absent from the Access bundle. Fresh local gates pass, but Zero Trust Free activation requires payment-method and overage authorization, so no Access application/session or remote CPU acceptance was created.

The verified source baseline is `12` content records, `5` settings, and `9` media. The earlier requested value `10` media is not present in the source, Payload verification, or migration manifest.

Current verdict:

```text
LIGHT CMS STAGING BLOCKED
Workers Paid activation: CANCELLED
Additional paid subscription: NONE
CMS production: DECAP
Website production provider: DECAP
Payload data preserved: YES
Production billing mutation: NONE
Production DNS mutation: NONE
```

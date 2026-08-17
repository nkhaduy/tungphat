# Payload CMS Full Replacement Design

## Goal

Replace the Git-backed Decap/Light CMS and its Cloudflare Pages runtime with Payload CMS while preserving the public website's design, routes, SEO, supplier catalogues, Google reviews, forms, analytics, and R2 media URLs.

## Audited Baseline

- Public site: Next.js static export deployed on Vercel at `https://mdftungphat.com`.
- Legacy CMS: Cloudflare Pages project `tungphat-light-cms-production` at `https://cms.mdftungphat.com`.
- Legacy data: Git Markdown/JSON content plus D1 `tung-phat-leads` for leads, analytics, CMS sessions, GBP OAuth/reviews, and managed reviews.
- Supplier data: generated JSON for An Cuong, Thanh Thuy, and Ba Thanh; 3,639 searchable supplier records and 2,910 public color-code records.
- Media: private R2 bucket `tung-phat-media`, 13,252 objects, 10.6 GB. Public delivery currently passes through the legacy CMS media route.
- Existing Payload shadow: Payload 3.86 Worker and D1 `tungphat-payload-cms`, containing 6 products, 3 articles, 1 project, 2 pages, 9 media records, and 1 user.
- Repository state: local `main` is intentionally divergent from `origin/main`; no reset, rebase, or overwrite is permitted.

## Architecture

`mdftungphat.com` remains the presentation layer. Payload runs as the only CMS/API backend on Cloudflare Workers, backed by the existing dedicated Payload D1 database. Payload binds directly to the existing production R2 bucket and stores object keys, URLs, hashes, dimensions, and alt text without copying binary objects.

The production CMS hostname remains `cms.mdftungphat.com`, minimizing CSP, media, SEO, and operational changes. During cutover the hostname moves from the legacy Pages project to the Payload Worker only after shadow verification passes.

The static frontend fetches published Payload data during its production build. Local tests use committed minimal fixtures, but production content is authoritative only in Payload. Supplier crawlers retain their discovery and normalization logic and replace JSON publication with idempotent Payload upserts plus a Vercel deploy hook or explicit production deploy.

## Payload Data Model

- `users`: Payload admin authentication with roles; migrate only the active administrator, never sessions or reset artifacts.
- `suppliers`: An Cuong, Thanh Thuy, Ba Thanh, source metadata, sync state, and public branding.
- `categories`: hierarchical material/category taxonomy.
- `materialCodes`: supplier code records, slug, category relationships, descriptions, specifications, dimensions, thickness, material type, finish, source URL, publish state, SEO, galleries, and sync metadata.
- `media`: R2 object metadata only; unique object key and checksum prevent duplicates.
- `products`, `articles`, `projects`, `pages`: existing editorial content and SEO fields.
- `reviews`: managed and Google review data needed by the public widget.
- `gbpConnections`: encrypted OAuth state and per-branch sync status; secrets remain encrypted and are never logged.
- `redirects`: explicit redirect source, destination, status, and active flag.
- `leads`: contact and quote submissions plus status history.
- `analyticsEvents` and required aggregates: retained business analytics, excluding expired cache/session/rate-limit data.
- globals: business settings, SEO defaults, static page content, review widget settings.

## Migration

Create one timestamped legacy D1 export outside the repository before mutation. The migration is idempotent and keyed by stable legacy identifiers, supplier+code, slug, review ID, and R2 object key. It records migrated, skipped, failed, deduplicated, media-reference, and orphan totals. Production cutover requires zero unexplained failures.

Migrate editorial Git content, current supplier normalized records, required D1 business data, review configuration, redirects, and R2 metadata. Do not migrate CMS sessions, login attempts, rate limits, expired caches, crawler reports, screenshots, debug output, stale sync logs, or duplicate media.

## Runtime Compatibility

Payload custom endpoints replace legacy forms, analytics collection, public reviews, GBP sync/OAuth callbacks, health, and R2 media delivery. Public response shapes remain compatible until frontend consumers are switched in the same deployment. This is runtime API continuity, not a legacy CMS compatibility layer; old route implementations are deleted after cutover.

## Verification And Cutover

Run typecheck, lint, unit, integration, production build, migration verification, and critical E2E. Verify the Payload shadow Worker and D1 counts, then deploy the frontend against Payload. Move `cms.mdftungphat.com` only after health, admin login, CRUD/publish, supplier sync, reviews, forms, analytics, images, metadata, sitemap, robots, redirects, and important public pages pass.

Production verification uses real desktop and mobile browser sessions and checks console errors, failed network requests, broken images, hydration errors, and API failures.

## Cleanup

Only after production PASS: delete the legacy Pages CMS project, legacy preview/staging CMS projects proven unused, legacy D1 databases and CMS-only tables, stale preview R2 buckets, old CMS secrets/bindings/jobs, Decap/Git gateway/auth code, dependencies, docs, and generated artifacts. Preserve the production `tung-phat-media` bucket and any non-CMS Cloudflare/Vercel/GitHub integrations still consumed.

Record before/after D1, R2, repository, and CMS-resource sizes. Keep the single emergency snapshot outside Git only as long as required for the verified rollback window, then minimize or remove it.

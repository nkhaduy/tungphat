# Supplier Full Import Runbook

## Safety Boundary

This runbook operates on public supplier catalogue evidence and local build artifacts. It does not authorize production deployment, DNS changes, CMS writes, supplier form submission, stock/price claims, or media-rights changes. Run refreshes on an isolated branch and review all generated diffs before committing.

Do not run a live crawl or media download as part of a documentation-only verification pass. The committed full manifests are the offline source of truth for deterministic validation.

## Prerequisites

1. Confirm a clean supplier-owned diff with `git status --short`.
2. Install the pinned dependencies with `npm ci` when needed.
3. Confirm enough disk capacity before any explicitly approved media refresh.
4. Preserve rights as `UNCONFIRMED` unless legal/editorial review provides separate evidence.
5. Never use the An Cường sample command to produce canonical artifacts.

## Offline Validation And Search Rebuild

```bash
npm run catalog:suppliers:validate
npm run catalog:suppliers:media:validate
npm run catalog:suppliers:search-index
npm run catalog:suppliers:test
```

Run the search-index command twice. Both runs must report 3,558 records and checksum `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`, and the second run must leave `data/catalogs/supplier-search-index.json` unchanged.

## Supplier Refresh Workflow

Use supplier-specific help/scripts in `package.json` and existing supplier runbooks before initiating any approved live operation. The safe sequence is:

1. discover public URLs into resumable raw/cache artifacts;
2. crawl details with source allowlists, timeout/retry limits, and resume enabled;
3. classify every discovered URL as imported, duplicate/redirected, removed, invalid, or non-product;
4. normalize without inventing codes or commercial facts;
5. run a dry import and inspect created/updated/unchanged/removed counts;
6. run the committed import path twice to prove idempotency;
7. rebuild the compact search index;
8. validate media provenance without broad downloads unless separately approved;
9. build and audit routes, canonical tags, JSON-LD, sitemap membership, links, and accessibility;
10. review the full diff and commit supplier-owned changes only.

## Resume And Pagination Troubleshooting

- Resume from committed/raw cache boundaries; do not delete a cache merely to force progress.
- If a sitemap index changes, preserve the old URL accounting until each removed URL receives an explicit outcome.
- For paginated REST sources, verify page sizes and terminal-page behavior. A short final page is valid; a repeated page or missing page is a failure.
- For redirects, retain the exact redirect chain and canonical destination. Do not infer identity from similar slugs.
- For custom 404 pages returning HTTP 200, classify by page content and preserve the evidence reason.
- On rate limiting, stop the live phase, retain partial evidence, and resume later. Do not parallelize aggressively or bypass supplier controls.

## Stale Removal Policy

A previously imported record may be removed only when current public evidence explicitly supports removal and the manifest records the old URL outcome. If other current evidence still exposes a code, retain it as relation-only/source-backed evidence and remove only the dead detail-route claim.

Never delete unrelated supplier records, local editorial fields, or media solely because one discovery surface disappeared.

## Media Refresh Policy

- Prefer validation-only: `npm run catalog:suppliers:media:validate`.
- Preserve source URL, checksum, local path, resolution, fetch status, and rights status.
- Use bounded small batches for approved preview downloads.
- Do not hotlink source media in public UI.
- Treat original-only and deferred assets as unresolved local custody, not failures of source accounting.
- Keep all rights `UNCONFIRMED` pending separate approval.

## Restore And Rollback

Restore by reverting only the supplier refresh commit on a new branch, then regenerate the compact search index and rerun all gates. Do not reset the worktree or overwrite unrelated user changes. If a generated artifact changes unexpectedly, preserve both evidence sets until the cause is understood.

## Required Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run validate:links
npm run catalog:suppliers:audit:output
npm run catalog:suppliers:media:validate
git diff --check
```

Run Playwright accessibility journeys with `npm run test:e2e` when the local Cloudflare test server and browser runtime are available. The relevant specs use `@axe-core/playwright`. Record an exact blocker instead of claiming an accessibility pass when the browser/server gate cannot run.

## New Supplier Onboarding

1. Define a supplier ID, source allowlist, manifest schema, record schema, and route owner.
2. Add fixtures for redirects, non-products, custom 404s, missing codes, duplicates, and pagination.
3. Require 100% source URL accounting before exposing search records.
4. Separate SKU, family, and document records; never synthesize missing identifiers.
5. Assign SEO status independently from searchability.
6. Add deterministic compact-index generation and unique-ID tests.
7. Add sitemap/canonical/JSON-LD/brand-isolation tests before granting indexability.
8. Add media provenance with `UNCONFIRMED` rights by default.
9. Run the import twice and record mutation/checksum idempotency.
10. Update the coverage and final reports with generated totals rather than prose-only claims.

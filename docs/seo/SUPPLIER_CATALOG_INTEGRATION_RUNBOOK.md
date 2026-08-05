# Supplier Catalogue Integration Runbook

Run every command from the integration repository root with the Node/npm versions declared by `package.json`. These workflows read public supplier sources and write only local files. They do not authorize CMS writes, remote database migrations, pushes or deployments.

## Safety preflight

```bash
git status --short --branch
git branch --show-current
git rev-parse HEAD
npm ci
```

Expected branch: `codex/catalog-suppliers-integration`. Stop if the worktree contains unrelated changes or if the branch is `main`.

## Update Thanh Thuy

```bash
npm run catalog:thanh-thuy:discover -- --refresh
npm run catalog:thanh-thuy:crawl -- --refresh
npm run catalog:thanh-thuy:import -- --dry-run
npm run catalog:thanh-thuy:import
npm run catalog:thanh-thuy:import
npm run catalog:thanh-thuy:validate
npm run catalog:thanh-thuy:audit-duplication
```

The second import must report 348 unchanged and zero unexpected creates or updates when the source snapshot is unchanged. A failed refresh must preserve the last valid catalogue.

## Update Ba Thanh

```bash
npm run catalog:ba-thanh:discover -- --refresh
npm run catalog:ba-thanh:crawl -- --refresh
npm run catalog:ba-thanh:import -- --dry-run --refresh
npm run catalog:ba-thanh:import
npm run catalog:ba-thanh:import
npm run catalog:ba-thanh:validate
npm run catalog:ba-thanh:audit
```

The second import must report `created: 0`, `updated: 0`, `duplicates: 0` and `unchanged: 233` unless an intentional source or editorial change was approved. Never promote the 227 enrichment records automatically.

## Update An Cuong

The pinned crawler exposes separate phases so failures remain resumable and auditable:

```bash
npm run catalog:ancuong:discover
npm run catalog:ancuong:crawl:listings
npm run catalog:ancuong:crawl:details
npm run catalog:ancuong:crawl:relations
npm run catalog:ancuong:media -- --concurrency=1
npm run catalog:ancuong:normalize
npm run catalog:ancuong:validate
npm run catalog:ancuong:diff
npm run catalog:ancuong:export
npm run catalog:ancuong:report
```

For the representative pinned sample, `npm run catalog:ancuong:sample` runs the supported sample orchestration. `npm run catalog:ancuong:all` performs the configured full local pipeline and must still remain read-only against public source systems. Run `npm run catalog:ancuong:test:live` only when a deliberate live-source verification is required.

## Validate all suppliers

```bash
npm run catalog:suppliers:validate
npm run catalog:suppliers:test
npm run catalog:suppliers:audit
npm run build
npm run catalog:suppliers:audit:output
npm run validate:links
npm run lint
npm run typecheck
npm test
```

The build must retain 35 canonical sitemap URLs, including eight Thanh Thuy URLs and 12 Ba Thanh URLs. An Cuong remains out of the sitemap while its pinned route is noindex.

## Audit routes, sitemap and metadata

```bash
node scripts/check-static-output.mjs
node scripts/check-sitemap-output.mjs
node scripts/check-metadata-output.mjs
node scripts/check-internal-links.mjs
npm run catalog:suppliers:audit:output
```

Review any route collision, non-200 sitemap URL, redirect relationship, missing H1, canonical mismatch, invalid JSON-LD, supplier brand mismatch or orphan indexable page before committing.

## Audit media

```bash
npm run images:check
npm run catalog:thanh-thuy:validate
npm run catalog:ba-thanh:validate
npm run catalog:ancuong:media -- --concurrency=1
npm run catalog:ancuong:validate
```

Keep media under supplier namespaces. Do not hotlink, bulk rename stable paths or move An Cuong runtime binaries into the deployable public bundle without an explicit product decision and usage-right confirmation.

## Roll back one supplier import

Thanh Thuy supports its local import backup:

```bash
npm run catalog:thanh-thuy:import -- --rollback latest
npm run catalog:thanh-thuy:validate
```

For a committed Ba Thanh or An Cuong refresh, create a new safe branch and revert only the supplier refresh commit:

```bash
git show --stat <supplier-refresh-commit>
git revert <supplier-refresh-commit>
npm run catalog:suppliers:validate
npm run build
```

Do not use `git reset --hard`, `git clean`, wholesale media deletion or a restore that includes unrelated files.

## Source URL changed

1. Confirm the replacement URL is public, HTTPS, allowed by robots.txt and inside the supplier allowlist.
2. Update the supplier-specific source configuration or parser fixture only.
3. Run discovery and compare counts before detail crawling.
4. Reject cross-host redirects unless the new public host is separately reviewed and allowlisted.
5. Preserve the last good local snapshot until validation passes.

## Source code or product removed

Do not translate one failed request into deletion. Confirm whether the record moved, redirected or became temporarily unavailable. Preserve published editorial fields and stable slugs; mark the supplier-specific unavailable/enrichment status and keep the route noindex until reviewed.

## Media failed

Verify source URL, HTTP status, MIME, dimensions and checksum. Remove only a proven stale cache entry, rerun the supplier media phase and retain the existing good binary when the source is temporarily unavailable. Never invent or color-adjust material imagery to hide a failed download.

## Add a fourth supplier

1. Add a stable `SupplierId`, definition and registry entry under `lib/catalog/core/`.
2. Create a supplier adapter under `lib/catalog/suppliers/` with search entries, route claims and sitemap entries.
3. Keep discovery/crawl/import/normalize/validate code under `scripts/<supplier>/` and data/media in supplier namespaces.
4. Add route ownership, exact-code search, indexability, sitemap, canonical, JSON-LD brand and idempotency tests before implementation.
5. Re-run collision, media, output, link, accessibility and Lighthouse audits.
6. Update architecture, provenance, cannibalization and final reports. Do not weaken another supplier's schema or SEO policy to fit the new source.

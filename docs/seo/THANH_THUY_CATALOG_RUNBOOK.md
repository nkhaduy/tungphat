# Thanh Thuy Catalogue Runbook

Run commands from the repository root on the catalogue branch. Node.js must satisfy the version in `package.json`.

## Install

```bash
npm ci
```

## Discover source URLs

Uses robots.txt and public product/category sitemaps. Cached files are reused unless `--refresh` is passed.

```bash
npm run catalog:thanh-thuy:discover
npm run catalog:thanh-thuy:discover -- --refresh
```

Output: `data/imports/thanh-thuy/source-manifest.json`.

## Crawl the public catalogue

```bash
npm run catalog:thanh-thuy:crawl
npm run catalog:thanh-thuy:crawl -- --refresh
```

Raw responses are stored under ignored `.cache/thanh-thuy/`. The crawler uses low request concurrency, retry/backoff and resume-safe per-page cache.

## Dry-run import

```bash
npm run catalog:thanh-thuy:import -- --dry-run
```

The dry run crawls or resumes cached source data, validates normalization and processes images in cache without replacing the published catalogue/media files.

For a previously captured public source snapshot:

```bash
npm run catalog:thanh-thuy:import -- --dry-run --source-dir /absolute/path/to/source-snapshot
```

## Import/update catalogue

```bash
npm run catalog:thanh-thuy:import
```

Force a source refresh while preserving the last successful catalogue if the crawl fails:

```bash
npm run catalog:thanh-thuy:import -- --refresh
```

Changed records retain existing Tùng Phát descriptions/applications where possible. Missing source data never triggers automatic deletion of the last successful catalogue.

## Validate

```bash
npm run catalog:thanh-thuy:validate
npm run catalog:thanh-thuy:audit-duplication
```

Validation checks attribution, source URL scope, unique IDs/slugs/source URLs, checksums, local media paths, quality statuses, prohibited commerce fields and hotlinks.

## View error/status records

```bash
node -e 'const c=require("./data/catalogs/thanh-thuy/catalog.json"); console.table(c.products.filter(p=>p.seoStatus!=="READY_TO_INDEX").map(p=>({code:p.code,name:p.name,status:p.seoStatus,sourceUrl:p.sourceUrl})))'
```

View summary:

```bash
node -e 'const r=require("./data/imports/thanh-thuy/import-report.json"); console.log(r.statuses)'
```

## Roll back the latest local import

An import creates a backup when an older catalogue exists.

```bash
npm run catalog:thanh-thuy:import -- --rollback latest
npm run catalog:thanh-thuy:validate
```

Rollback restores the previous catalogue and removes only media recorded as created by the rolled-back import. It does not run against production unless a human later deploys the branch.

## Build and test

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run validate:links
npm run test:e2e
```

## Updating one changed supplier product

The importer is snapshot-based and idempotent. Run discovery/import normally; dedupe uses source URL, product code, route slug and source checksum. Review `data/imports/thanh-thuy/import-report.json`, then inspect changed catalogue entries before committing.

## Files safe to delete locally

`.cache/thanh-thuy/`, `out/`, Playwright output and other ignored build artifacts can be removed when no resume/rollback is needed. Do not commit raw cache, cookies, browser profiles or temporary source HTML.

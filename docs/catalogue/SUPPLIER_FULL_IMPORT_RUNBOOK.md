# Supplier Full Import Runbook

## Safety Boundary

Run commands from the repository root on an isolated branch. Commands marked **LIVE NETWORK** fetch public supplier hosts or media and can write local cache/raw/output files. Commands marked **LOCAL** use committed snapshots or local caches. Task 5 ran only local validation and deterministic rebuilds; it did **not** run any live discovery, crawl, media download, preview deployment, DNS change, CMS write, or production mutation.

Do not change media rights from `UNCONFIRMED`, invent product/commercial facts, or hotlink supplier media. Review `git status --short` and generated diffs after every write.

## Prerequisites

```bash
git status --short --branch
git branch --show-current
npm ci
```

Use Node/npm versions declared by `package.json`. Preserve `.cache/` and checkpoint files when resuming. Confirm disk capacity before media work.

## An Cường

The CLI accepts `--dry-run`, `--resume`, `--force`, `--changed-only`, `--skip-media`, `--verbose`, `--category=`, `--product=`, `--limit=`, and `--concurrency=`.

### Discover and crawl

**LIVE NETWORK** (writes `data/imports/ancuong/reports/discovery-manifest.json` and raw/state checkpoints):

```bash
npm run catalog:ancuong:discover -- --resume
npm run catalog:ancuong:discover:documents -- --resume
npm run catalog:ancuong:crawl:non-numeric -- --resume
npm run catalog:ancuong:crawl:product-lines -- --resume
npm run catalog:ancuong:crawl:listings -- --resume
npm run catalog:ancuong:crawl:details -- --resume
npm run catalog:ancuong:crawl:relations -- --resume
```

An Cường discovery always performs a fresh public fetch; `--resume` applies to the checkpointed listing/detail stages. Use `--force` there to intentionally ignore a checkpoint, or `--changed-only` only with the existing diff report. There is no `--refresh` flag in this CLI. `npm run catalog:ancuong:all -- --resume --skip-media` runs the configured non-media sequence.

### Dry-run and import

**LOCAL** against the existing raw/normalized artifacts:

```bash
npm run catalog:ancuong:normalize -- --dry-run
npm run catalog:ancuong:manifest -- --dry-run
npm run catalog:ancuong:validate -- --dry-run
npm run catalog:ancuong:diff -- --dry-run
npm run catalog:ancuong:export -- --dry-run
```

The canonical import sequence is:

```bash
npm run catalog:ancuong:normalize -- --resume
npm run catalog:ancuong:manifest -- --resume
npm run catalog:ancuong:validate -- --resume
npm run catalog:ancuong:diff -- --resume
npm run catalog:ancuong:export -- --resume
npm run catalog:ancuong:report -- --resume
```

Run the same sequence a second time. The second run must preserve manifest checksum, compact-record checksum, and source outcomes; inspect `git diff -- data/imports/ancuong data/catalogs` for unexpected mutations. `catalog:ancuong:sample` is parser evidence only and is isolated to sample discovery/listing/detail/state paths; it is not an import command.

### Stale removal and restore

There is no An Cường deletion/rollback flag. First create the manifest/diff and review each removed or invalid URL:

```bash
npm run catalog:ancuong:diff
npm run catalog:ancuong:validate
```

Remove a record only when the manifest contains explicit current evidence. To restore a committed refresh, create a safe branch and revert only its commit:

```bash
git switch -c codex/ancuong-restore
git revert <supplier-refresh-commit>
npm run catalog:ancuong:validate
npm run catalog:suppliers:search-index
```

Never reset or delete the whole supplier directory.

## Thanh Thuỳ

### Discover, crawl, resume, and refresh

**LIVE NETWORK** (resume is the default and uses `.cache/thanh-thuy/`):

```bash
npm run catalog:thanh-thuy:discover:full
npm run catalog:thanh-thuy:audit:product-urls
npm run catalog:thanh-thuy:crawl:full
```

To bypass cache and recrawl, use the real `--refresh` flag:

```bash
npm run catalog:thanh-thuy:discover:full -- --refresh
npm run catalog:thanh-thuy:audit:product-urls -- --refresh
npm run catalog:thanh-thuy:crawl:full -- --refresh
```

For a captured source snapshot, pass real paths to the crawl/import commands: `--source-dir /absolute/path/to/source-snapshot --cache-dir /absolute/path/to/cache`.

### Dry-run, import, validation, second run

**LIVE NETWORK unless `--source-dir` and a complete cache are supplied:** the full importer can fetch source pages and media when cache entries are absent.

```bash
npm run catalog:thanh-thuy:import:full -- --dry-run
npm run catalog:thanh-thuy:import:full
npm run catalog:thanh-thuy:validate:full
npm run catalog:thanh-thuy:import:full
npm run catalog:thanh-thuy:validate:full
```

The second import must be idempotent (the committed evidence is 348 unchanged products). Review `data/imports/thanh-thuy/full-import-report.json` and the generated diff before accepting updates.

### Stale removal and restore

Missing or failed source pages do not authorize deletion. Preserve the manifest outcome and keep the last valid record until a moved/removed page is confirmed. The supported local rollback restores the latest importer backup:

```bash
npm run catalog:thanh-thuy:import -- --rollback latest
npm run catalog:thanh-thuy:validate:full
```

Use the same `--cache-dir` used for the import when the backup is outside the default cache.

## Ba Thanh

### Discover, crawl, resume, and refresh

**LIVE NETWORK** (resume is the default through the request cache):

```bash
npm run catalog:ba-thanh:discover:full
npm run catalog:ba-thanh:crawl:full
```

To bypass cache, use the supported `--refresh` flag on both commands:

```bash
npm run catalog:ba-thanh:discover:full -- --refresh
npm run catalog:ba-thanh:crawl:full -- --refresh
```

### Dry-run, import, validation, second run

**LOCAL** against the completed Ba Thanh discovery/crawl artifacts:

```bash
npm run catalog:ba-thanh:import:full -- --dry-run
npm run catalog:ba-thanh:import:full
npm run catalog:ba-thanh:validate:full
npm run catalog:ba-thanh:import:full
npm run catalog:ba-thanh:validate:full
```

The second full import must preserve the committed 305-record result and report zero unexpected mutations. `--validate-only` is available on the underlying full script through `npm run catalog:ba-thanh:validate:full`.

### Stale removal and restore

Review `data/imports/ba-thanh/full-source-manifest.json` before removing anything. A missing request is not removal evidence; retain an explicit `non-product`, `duplicate`, `redirected`, or failed outcome and investigate. No Ba Thanh rollback script exists. Restore only the supplier refresh commit:

```bash
git switch -c codex/ba-thanh-restore
git revert <supplier-refresh-commit>
npm run catalog:ba-thanh:validate:full
npm run catalog:suppliers:search-index
```

## Media Validation And Bounded Preview

**LOCAL:** validate committed provenance and local bytes without network access:

```bash
npm run catalog:suppliers:media:validate
```

**LIVE NETWORK:** a bounded preview fetch is capped at 50 URLs by the script; the documented review batch is ten:

```bash
npm run catalog:suppliers:media -- --download-previews --preview-limit=10
```

Do not run an unbounded original-media download. Re-run `npm run catalog:suppliers:media:validate` after any approved preview batch.

## Search Rebuild

**LOCAL:** rebuild twice and compare the artifact checksum and file bytes:

```bash
npm run catalog:suppliers:search-index
npm run catalog:suppliers:search-index
```

The committed result is 3,558 records with checksum `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`.

## Preview Serve And Deployment Boundary

**LOCAL preview serve:** validates config, builds the static site, and starts Wrangler Pages dev:

```bash
npm run cf:preview
```

The repository has no public catalogue deployment script. The website uses Vercel Git Integration; a public preview would require the external mutation below after human approval, and Task 5 did not run it:

```bash
git push -u origin codex/catalog-full-supplier-import
```

Do not run a production deploy while media rights are `UNCONFIRMED`. Cloudflare CMS commands such as `npm run cms:deploy` are unrelated to the public catalogue and are out of scope.

## Pagination Troubleshooting

- Thanh Thuỳ uses 100-record WordPress pages and stores `products-N.json` plus metadata. If totals or the terminal page change, run `npm run catalog:thanh-thuy:discover:full -- --refresh`, then `npm run catalog:thanh-thuy:audit:product-urls -- --refresh`; do not concatenate pages manually.
- Ba Thanh records the API page list in `data/imports/ba-thanh/full-discovery.json`. Re-run `npm run catalog:ba-thanh:discover:full -- --refresh` and confirm `publicPageApiRecords`, `pageApiPages`, and the final short page before crawling.
- An Cường listing/detail crawlers use checkpoint state. Resume with `--resume`; use `--force` only after preserving the prior manifest. A repeated page, missing terminal page, redirect cycle, or custom 404 with HTTP 200 is a classification failure, not a reason to widen the allowlist.
- On rate limiting or a partial response, stop the live phase, keep the cache/checkpoint, and resume later. Do not increase concurrency beyond the script defaults or bypass robots rules.

## New Supplier Onboarding

1. Add a supplier ID, source allowlist, manifest schema, normalized record schema, and route owner.
2. Add fixtures for redirects, duplicates, non-products, custom 404s, missing identifiers, and pagination boundaries.
3. Require every discovered source row to have an explicit outcome before search exposure; unresolved must be zero.
4. Keep source URL accounting, normalized record classes, SEO status, and media provenance as separate reports.
5. Add deterministic search-index generation, unique-ID tests, canonical/JSON-LD/sitemap/link tests, and supplier-isolation tests.
6. Set media rights to `UNCONFIRMED`, use bounded previews only, and validate capacity before any preview deployment.
7. Run the import twice, record mutation/checksum idempotency, review stale removals, and document restore steps.

## Required Local Gates

```bash
npm run catalog:suppliers:validate
npm run catalog:suppliers:test
npm run catalog:suppliers:audit:output
npm run catalog:suppliers:media:validate
npm run catalog:suppliers:search-index
npm run lint
npm run typecheck
npm run build
npm run validate:links
npm test
git diff --check
```

Run `npm run test:e2e` only when the local test server and browser runtime are available, and record exact blockers instead of claiming a browser pass.

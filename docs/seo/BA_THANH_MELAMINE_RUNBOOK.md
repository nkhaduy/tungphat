# Ba Thanh Melamine Catalogue Runbook

## Prerequisites

- Run from the repository root on a non-production branch.
- Use the repository Node/npm versions and installed dependencies.
- Confirm `git status`, current branch, HEAD and remote before every refresh.
- Do not run deploy, remote D1 migration or production CMS commands as part of this workflow.
- Never add `.cache/ba-thanh/`, `out/`, Playwright profiles, cookies, tokens or temporary logs to Git.

## Standard refresh

```bash
npm run catalog:ba-thanh:discover -- --refresh
npm run catalog:ba-thanh:crawl -- --refresh
npm run catalog:ba-thanh:import -- --dry-run --refresh
npm run catalog:ba-thanh:import
npm run catalog:ba-thanh:import
npm run catalog:ba-thanh:validate
npm run catalog:ba-thanh:audit
npm test
npm run typecheck
npm run build
npm run validate:links
```

The second real import must report `created: 0`, `updated: 0`, `unchanged: 233` and `duplicates: 0` unless the source or importer intentionally changed. Review any unexpected update before committing generated data.

The request cache expires after six hours. `--refresh` bypasses it for a deliberate source check; the refreshed dry-run warms media cache so the following real import does not repeat requests unnecessarily.

## Discover URLs

`catalog:ba-thanh:discover` fetches robots.txt and the public map page, finds category panels from the DOM, extracts candidate detail links and writes:

- `data/imports/ba-thanh/source-manifest.json`
- `data/imports/ba-thanh/discovered-codes.json`

The command uses only HTTPS URLs on `bathanh.com.vn`. Do not broaden the source host whitelist or replace panel discovery with an unrestricted domain crawl.

## Crawl detail pages

`catalog:ba-thanh:crawl` reads only the discovered candidates. It limits concurrency to 3, spaces requests, retries with exponential backoff, uses the transparent Tùng Phát user agent and caches responses under ignored `.cache/ba-thanh/`. Robots rules are evaluated for the initial URL and every redirect; an unparseable non-empty policy fails closed. Same-host redirects are capped at five and cycles are rejected.

A detail page is accepted only when its visible heading/content relationship confirms the expected Melamine code. Root-level detail routes are valid; URL prefix alone is not an acceptance rule.

## Dry-run and import

The dry-run calculates normalization, media and merge results without writing the catalogue/media output. The real import writes:

- `data/catalogs/ba-thanh.json`
- `data/imports/ba-thanh/import-report.json`
- local full images and swatch thumbnails under `public/catalog/ba-thanh/`

Source fields are refreshed; Tùng Phát editorial fields are preserved. If a repeat import is incomplete, the last valid published snapshot is retained instead of being replaced by degraded source data. Multiple detail images of the same type receive stable ordinal filenames to prevent overwrites. To enrich an indexable code, add reviewed copy and applications to `READY_EDITORIAL` in `scripts/ba-thanh/config.ts`, then run the import and validation again. Do not mark a code ready solely because an image exists.

## Validation and duplication audit

`catalog:ba-thanh:validate` checks codes, supplier/code uniqueness, slugs, source URLs, provenance, local media, thumbnails, dimensions, alt text, publish/index status and thin-page policy.

`catalog:ba-thanh:audit` compares editorial text with parsed source text and writes both JSON and Markdown findings. Facts such as code, supplier, group and verified dimensions may match. Landing copy, applications, FAQ, metadata, CTA and service guidance must remain independently written.

## Source URL changed

1. Confirm the new URL is public, permitted by robots.txt and still on the whitelisted host.
2. Update only `SOURCE_INDEX_URL` or the source recognizer needed for the verified DOM change.
3. Add/update parser fixtures before changing extraction behavior.
4. Run discover and inspect category/count differences before crawling details.
5. Do not follow arbitrary redirects to another host.

## A source code disappeared

The importer does not delete an existing published record merely because one source request fails. Investigate whether the page moved, redirected or was temporarily unavailable. Mark the record `SOURCE_UNAVAILABLE` or keep it unpublished/noindex after editorial review; do not silently delete a previously referenced URL.

## An image is missing or broken

1. Check `source-manifest.json` and the source image URL.
2. Remove only the affected cached response if a verified stale cache is the cause.
3. Re-run import; MIME, integrity and dimensions are validated by Sharp.
4. Keep the record `MEDIA_MISSING`/noindex if a valid local image cannot be produced.
5. Never replace a material swatch with AI-enhanced, upscaled or color-adjusted media.

## Roll back an import batch

Generated catalogue and media are source-controlled. Roll back the specific import commit with `git revert <commit>` on a safe branch, then rebuild and validate. Do not use `git reset --hard`, do not delete the media directory wholesale and do not restore unrelated working-tree files.

## Review records not ready to index

```bash
jq '.[] | select(.seoStatus != "READY_TO_INDEX") | {code: .displayName, status: .seoStatus, sourceUrl}' data/catalogs/ba-thanh.json
```

Before promotion, confirm exact code spelling, group, valid local media, original editorial value, applications, canonical, metadata and incoming internal links. Re-run the second import after promotion to verify idempotency.

## CMS synchronization

This branch does not mutate production CMS data. The catalogue currently builds from `data/catalogs/ba-thanh.json`. If CMS synchronization is introduced later, map source fields and editorial fields separately, use supplier plus normalized code as the external key, upsert in a preview/local environment first and never let a failed source crawl erase published editorial content.

## Thanh Thuy catalogue integration

Follow `docs/seo/SUPPLIER_CATALOG_MERGE_NOTES.md`. Reconcile supplier-agnostic types/components first, namespace media by supplier and aggregate sitemap entries centrally. Do not merge or cherry-pick either generated catalogue blindly. Run both suppliers' normalization, duplicate-slug, media and sitemap validators after integration.

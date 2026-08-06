# An Cuong Sample Limit Root Cause

## Observed Result

The rollout branch exposed seven An Cuong records. `data/imports/ancuong/export/catalogue.json` contained 7 records, while its committed discovery manifest contained 2,682 product URLs and 33 categories. The shared supplier adapter imported that seven-record export directly, so catalogue search and UI could not expose anything else.

A fresh source audit on 2026-08-06 finds 30 current product listing categories and 2,678 current product URLs. Three former `gia-cong-*` service categories and four former product URLs are no longer present and must be accounted as removed/non-product rather than silently retained.

## Expected Result

Canonical full-import output must contain every currently discovered and valid public product record, with every discovered URL explicitly accounted. Representative sample output may exist for parser development, but it must never replace canonical normalized or exported data.

## Exact Limiting Code

Commit `3a96f96a721c52c49e3d81d4bc7988550c982843` introduced the sample runner:

- Historical `scripts/ancuong/sample.ts:23` defaulted `requestedLimit` to 7.
- Historical `scripts/ancuong/sample.ts:40` forced `target = Math.max(7, requestedLimit)`.
- Historical `scripts/ancuong/sample.ts:45` returned `selected.slice(0, target)`.
- Historical `scripts/ancuong/sample.ts:53` used `options.limit ?? 7`.
- Historical `scripts/ancuong/sample.ts:55` passed `sample-listings.json` to the detail crawler without an alternate output path. `crawl-details.ts` therefore wrote those seven details to the canonical `data/imports/ancuong/raw/details.json`.
- Historical `scripts/ancuong/sample.ts:56-61` then ran relations, normalize, media, validate, diff, export and report against shared canonical paths.

The canonical adapter at `lib/catalog/suppliers/an-cuong.ts:1` imports `data/imports/ancuong/export/catalogue.json` directly, so any sample run that reached export immediately became the website catalogue dataset.

## Exact Limiting Configuration

- `package.json:59` exposes `catalog:ancuong:sample` as a supported command.
- The previous runbook recommended `npm run catalog:ancuong:sample -- --limit=7 --resume`.
- `docs/seo/SUPPLIER_CATALOG_INTEGRATION_FINAL_REPORT.md:17-18` records a second integration decision: the rollout intentionally pinned the earlier seven-record An Cuong snapshot and excluded eleven later full-crawl commits.

The seven-record production-visible result therefore had two direct causes: sample mode wrote to canonical artifact paths, and the rollout integrated the pinned sample snapshot instead of the separate later full-crawl dataset.

## Affected Pipeline Stage

The limit originated in sample selection, then propagated through raw detail output, normalization, validation, export, supplier adapter search entries and the public catalogue UI. Discovery itself was not limited: it still recorded thousands of product URLs.

## Why Tests Did Not Catch It

- `tests/ancuong/sample.test.ts` only asserted that representative selection returned seven varied records; it did not assert artifact isolation.
- `tests/ancuong/pipeline-validate.test.ts` only rejected an empty catalogue. Any non-empty subset, including seven records, passed.
- Export tests verified stable serialization/checksums for arbitrary input, not reconciliation against discovery.
- Supplier integration tests accepted the pinned seven-record fixture and treated noindex as sufficient protection.
- No test compared canonical imported IDs with all IDs from the discovery manifest.

## Fix

- `scripts/ancuong/sample.ts:50-74` now writes only `sample-listings.json` and `sample-details.json` and no longer invokes canonical normalize, media, validation, diff, export or report stages.
- `scripts/ancuong/validate.ts:83-91` rejects canonical full output when it contains seven or fewer records or omits a discovered source ID.
- Full-source manifests and accounted outcomes will replace count-only validation for all three suppliers.

## Regression Test

- `tests/ancuong/sample.test.ts` runs sample orchestration through injected real pipeline boundaries and verifies its detail output uses sample-only paths without normalized/export paths.
- `tests/ancuong/pipeline-validate.test.ts` fails a canonical import at seven records.
- `tests/ancuong/pipeline-validate.test.ts` fails when any discovered product ID is missing from canonical output.

The regression is behavioral: removing sample isolation or coverage enforcement makes the tests fail without relying on a source-text grep.

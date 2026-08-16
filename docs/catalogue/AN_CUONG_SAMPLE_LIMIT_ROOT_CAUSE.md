# An Cường Sample Limit Root Cause

## Observed Result

The rollout branch exposed seven An Cường records. `data/imports/ancuong/export/catalogue.json` contained seven records even though discovery had thousands of product URLs, and the shared supplier adapter imported that export directly. Catalogue search and the UI therefore could not expose anything outside the sample.

The current full-source manifest accounts for all 6,241 An Cường source rows. The canonical compact index now contains 2,900 searchable evidence records: 2,745 SKU records, 136 product families, and 19 catalogue-only/document records. This is source completeness, not a claim that every record is indexable or that all original media is locally held.

## Expected Result

Canonical full-import output must account for every discovered source row with an explicit outcome and retain every valid normalized record. Representative sample output may exist for parser development, but it must never replace canonical discovery, raw, normalized, export, state, or report artifacts.

## Exact Limiting Code

Commit `3a96f96a721c52c49e3d81d4bc7988550c982843` introduced the sample runner:

- Historical `scripts/ancuong/sample.ts:23` defaulted `requestedLimit` to 7.
- Historical `scripts/ancuong/sample.ts:40` forced `target = Math.max(7, requestedLimit)`.
- Historical `scripts/ancuong/sample.ts:45` returned `selected.slice(0, target)`.
- Historical `scripts/ancuong/sample.ts:53` used `options.limit ?? 7`.
- Historical `scripts/ancuong/sample.ts:55-62` passed only `sample-listings.json` to details and then ran relations, normalize, media, validate, diff, export, and report against shared canonical paths. Historical `scripts/ancuong/crawl-details.ts:19-21` defaulted the detail output and checkpoint to canonical `raw/details.json` and `state/crawl-details.json`.

The canonical adapter begins at `lib/catalog/suppliers/an-cuong.ts:1`; it imports the supplier search-index machinery, which replaced the old seven-record export only after the full-catalogue integration. The old adapter path consumed `data/imports/ancuong/export/catalogue.json`, so any sample run reaching export could become the website dataset.

## Exact Limiting Configuration

- Historical `scripts/ancuong/config.ts:4-12` defined all sample and full stages under the same `data/imports/ancuong/{raw,normalized,reports,state,export}` paths; there was no sample namespace.
- `package.json:72` exposes `catalog:ancuong:sample` as a supported command.
- Historical `docs/seo/SUPPLIER_CATALOG_INTEGRATION_RUNBOOK.md` recommended the sample command as the representative import path.
- `docs/seo/SUPPLIER_CATALOG_INTEGRATION_FINAL_REPORT.md:17-18` records the pinned snapshot decision: the rollout intentionally retained the earlier An Cường seven-record snapshot and excluded eleven later full-crawl commits.

The visible seven-record result therefore had two causes: the sample limit and the rollout's pinned sample snapshot. Discovery was not capped; the cap entered at sample selection and was propagated through the shared output paths.

## Affected Pipeline Stage

The limit originated in sample selection, then propagated through listing/detail state, normalization, media, validation, diff, export, the supplier adapter, catalogue search, and the public UI. Discovery itself still recorded thousands of URLs.

## Why Tests Did Not Catch It

- The old sample test proved representative selection returned seven varied records but did not assert isolation of discovery, listing, detail, or checkpoint paths.
- Pipeline validation rejected an empty catalogue but accepted any non-empty subset, including seven records.
- Export tests checked deterministic serialization for supplied input, not reconciliation against every discovered source ID.
- Supplier integration tests accepted the pinned seven-record fixture.
- No test compared canonical imported IDs with the complete discovery manifest.

## Fix

- Current `scripts/ancuong/sample.ts:41-89` accepts explicit sample discovery, listing, detail, listing-state, and detail-state paths. Defaults are `sample-discovery-manifest.json`, `sample-listings.json`, `sample-details.json`, `sample-crawl-listings.json`, and `sample-crawl-details.json`; it no longer invokes canonical normalize/media/validate/diff/export/report stages.
- `scripts/ancuong/validate.ts` rejects seven-or-fewer canonical output and rejects missing discovered product IDs.
- The full-source manifests account for every supplier URL, while `data/catalogs/supplier-search-index.json` contains each canonical searchable record exactly once.
- All 2,900 compact An Cường records remain noindex; curated category route claims are evaluated separately by the adapter. Sparse families and catalogue-only documents remain evidence records rather than thin detail pages.

## Regression Test

- `tests/ancuong/sample.test.ts:41-88` verifies discovery, listing, detail, and resume-state paths are sample-specific and never canonical.
- `tests/ancuong/pipeline-validate.test.ts` fails a canonical import at seven records and fails when any discovered product ID is missing.
- `tests/full-catalogue-search-index.test.ts` reconciles canonical supplier records with the compact search index.
- `tests/an-cuong-category-route.test.ts` verifies that only renderable curated category routes are claimed.

The regression is behavioral: removing sample isolation, complete-source validation, unique compact indexing, or route ownership makes the corresponding tests fail without relying on a source-text grep.

## Current Status

The seven-record limitation is absent from the canonical catalogue path. The current full import accounts for `6,241 / 6,241 = 100%` source rows and produces 2,900 unique searchable records. All 2,900 An Cường records are intentionally `noindex`: only the hub and curated `melamine`, `laminate`, and `acrylic` route claims are owned by the adapter, and records in other material groups route to the supplier hub instead of claiming unrendered paths.

Original-only and unresolved media remain capacity-safe/deferred, and all media rights remain `UNCONFIRMED`. No live crawl, broad media download, preview deployment, or production mutation was performed for Task 5.

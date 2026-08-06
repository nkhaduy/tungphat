# An Cường Sample Limit Root Cause

## Current Status

The seven-record limitation is no longer present in the canonical catalogue path. The current full import accounts for all 6,241 discovered source URLs and produces 2,900 unique searchable records: 2,745 SKU records, 136 family records, and 19 document records. The authoritative manifest is `data/imports/an-cuong/full-source-manifest.json`; the legacy `data/imports/ancuong/` spelling remains only in older An Cường pipeline paths.

All 2,900 compact search records are intentionally non-indexable. Only the An Cường hub and the curated `melamine`, `laminate`, and `acrylic` routes are claimed by the adapter. Records in other material groups route to the supplier hub instead of claiming routes that do not render.

## Historical Symptom

The rollout branch originally exposed seven An Cường records even though discovery contained thousands of product URLs. `data/imports/ancuong/export/catalogue.json` contained seven records, and the shared supplier adapter imported that export directly. Catalogue search and UI therefore could not expose anything outside the sample.

## Root Cause

Commit `3a96f96a721c52c49e3d81d4bc7988550c982843` introduced a sample runner that used seven as both the default sample size and the minimum selected size. More importantly, the sample workflow passed shared canonical paths to downstream detail, normalize, media, validation, export, and report stages. A sample run could therefore overwrite the canonical website dataset.

The rollout then pinned that seven-record snapshot instead of integrating the separate full-crawl artifacts. The visible limit had two direct causes:

1. sample mode was not isolated from canonical output paths; and
2. the integration selected the sample-era snapshot as the website source.

Discovery itself was not capped. The cap entered at sample selection and propagated through details, normalization, export, the supplier adapter, catalogue search, and the public UI.

## Why Existing Tests Missed It

- The sample test proved representative selection returned seven varied records, but did not prove sample/canonical artifact isolation.
- Pipeline validation rejected an empty catalogue, but accepted any non-empty subset.
- Export tests checked deterministic serialization for supplied input, not reconciliation against every discovered source ID.
- Supplier integration tests accepted the pinned seven-record fixture.
- No test compared canonical imported IDs with the complete discovery manifest.

## Corrective Controls

- Sample orchestration writes only sample-specific listing and detail artifacts and cannot invoke canonical normalize/export stages.
- Canonical An Cường validation rejects seven-or-fewer output and rejects missing discovered product IDs.
- `data/imports/an-cuong/full-source-manifest.json` accounts for every discovered URL with an explicit outcome.
- `data/catalogs/supplier-search-index.json` contains every canonical searchable An Cường record exactly once.
- Search-index generation uses deterministic stable ordering and checks duplicate IDs.
- Sparse families and source-only documents remain searchable evidence records without invented codes or thin detail pages.

## Current Reconciliation

| Measure | Count |
| --- | ---: |
| Source URLs accounted | 6,241 |
| Imported source entries | 2,975 |
| Duplicate/alias source entries | 2,821 |
| Removed source entries | 250 |
| Invalid source entries | 110 |
| Non-product/discovery entries | 85 |
| Unique searchable records | 2,900 |

Removed entries include 187 custom 404 pages and 63 removed detail pages whose public SKU evidence is retained from live relation cards. Non-product accounting includes 44 category sitemap surfaces, 30 category listing surfaces, and 11 discovery infrastructure URLs. None of these source-accounting entries is misrepresented as an additional indexable page.

## Regression Evidence

- `tests/ancuong/sample.test.ts` verifies sample-only detail output paths.
- `tests/ancuong/pipeline-validate.test.ts` rejects a seven-record canonical import and missing discovered IDs.
- `tests/full-catalogue-search-index.test.ts` reconciles canonical supplier records with the compact search index.
- `tests/an-cuong-category-route.test.ts` verifies that only renderable curated category routes are claimed.

The behavioral regression controls fail if sample isolation, full-source reconciliation, unique compact indexing, or route ownership is removed.

# Supplier Full Catalogue Coverage

## Coverage Summary

| Supplier | Source URLs accounted | Manifest outcomes | Searchable records | Record mix | Indexable records |
| --- | ---: | --- | ---: | --- | ---: |
| An Cường | 6,241 / 6,241 | 2,975 imported; 2,821 duplicate; 250 removed; 110 invalid; 85 non-product | 2,900 | 2,745 SKU; 136 family; 19 document | 0 |
| Thanh Thuỳ | 402 / 402 | 64 imported; 322 redirected; 16 non-product | 353 | 339 SKU; 9 family; 5 document | 1 |
| Ba Thanh | 717 / 717 | 665 imported; 7 duplicate; 45 non-product | 305 | 292 SKU; 11 family; 2 document | 6 |
| Total | 7,360 / 7,360 | Explicit outcome for every source URL | 3,558 | 3,376 SKU; 156 family; 26 document | 7 |

Coverage is 100% source accounting, not 100% indexability or complete original-media custody. A manifest row records what happened to a discovered URL. A compact record is a unique searchable entity. An indexable record must additionally satisfy the supplier route and editorial quality policy.

## SEO Status Reconciliation

| Supplier | `READY_TO_INDEX` | `NOINDEX_USEFUL` | `NEEDS_ENRICHMENT` | `SOURCE_ONLY` |
| --- | ---: | ---: | ---: | ---: |
| An Cường | 0 | 2,745 | 136 | 19 |
| Thanh Thuỳ | 1 | 9 | 338 | 5 |
| Ba Thanh | 6 | 70 | 227 | 2 |
| Total | 7 | 2,824 | 701 | 26 |

Only `READY_TO_INDEX` records whose concrete routes are owned by the supplier adapter can be indexable. Search/filter variants, sparse families, source-only documents, and enrichment-needed records remain outside the sitemap.

## Source Exclusions And Deferrals

- An Cường explicitly accounts for 250 removed, 110 invalid, and 85 non-product URLs. Relation-card evidence preserves 63 codes without pretending removed detail pages are live.
- Thanh Thuỳ explicitly accounts for 322 verified redirect aliases and 16 non-product/infrastructure URLs.
- Ba Thanh explicitly accounts for 7 duplicate paths and 45 non-product/infrastructure URLs.
- No supplier record invents a missing code, price, stock state, availability, or authorization statement.

## Search Index

`data/catalogs/supplier-search-index.json` is the generated compact search contract.

- Records: 3,558.
- Checksum: `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`.
- Approximate committed size: 1.7 MiB.
- Scope: catalogue server-route usage only; it is not imported by the homepage/global shell.
- Determinism: stable field ordering, stable record ordering, duplicate-ID rejection, and unchanged output on repeated regeneration.

## Media Coverage

| Measure | Count |
| --- | ---: |
| Source references | 10,654 |
| Unique source URLs | 7,923 |
| Local preview references | 589 |
| Checksum-deduplicated local files | 525 |
| Local bytes | 80,357,860 |
| Original-only references | 6,209 |
| Unresolved/deferred references | 3,856 |

All media rights remain `UNCONFIRMED`. Original-only and unresolved/deferred counts are explicit capacity/source constraints, not successful local imports. See `docs/seo/SUPPLIER_MEDIA_PROVENANCE.md` for per-asset provenance and operational rules.

## Authoritative Checksums

| Artifact | Checksum |
| --- | --- |
| An Cường full source manifest | `3455fd409fbae89421aaf4001db3938d94f4e7758dc1f76a425be118d3cc5999` |
| Thanh Thuỳ full source manifest | `c980583478f32ad5ca34d3acaed51950f43966dad2a5604e82671f7ecd376925` |
| Ba Thanh full source manifest | `fd7c1f4ef5e634f60f82966eba2c620734162417dc3204ed8c8d824b4b087998` |
| Combined supplier search index | `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2` |

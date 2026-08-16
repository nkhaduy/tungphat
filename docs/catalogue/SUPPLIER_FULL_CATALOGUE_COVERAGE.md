# Supplier Full Catalogue Coverage

## Accounted Source Matrix

The matrix keeps source discovery outcomes separate from normalized/search records. `Coverage percentage` is `accounted source rows / total manifest rows`; it is not an indexability or media-rights score.

| Supplier | Source categories | Category URLs | Product URLs discovered | API records discovered | Unique SKUs | Product families | Catalogue-only records | Imported | Noindex | Indexable | Rejected | Unresolved | Coverage percentage |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| An Cường | 30 | 74 | 2,932 | UNAVAILABLE | 2,745 | 136 | 19 | 2,975 | 2,900 | 0 | 445 | 0 | 6,241 / 6,241 = 100% |
| Thanh Thuỳ | 26 | 26 | 348 | 348 | 339 | 9 | 5 | 64 | 352 | 1 | 16 | 0 | 402 / 402 = 100% |
| Ba Thanh | 8 source feeds | 0 | 562 | 327 | 292 | 11 | 2 | 665 | 299 | 6 | 45 | 0 | 717 / 717 = 100% |
| Total | 64 source surfaces | 100 | 3,842 | 675 (available suppliers) | 3,376 | 156 | 26 | 3,704 | 3,551 | 7 | 506 | 0 | 7,360 / 7,360 = 100% |

### Definitions

- `Source categories` is the number of source category surfaces recorded by the supplier discovery. Ba Thanh has eight source category feeds, while its full manifest has no rows typed `category`; therefore `Category URLs` is exactly zero, not unavailable.
- `Category URLs` and `Product URLs discovered` count source URLs, not compact records. An Cường's product URL count is the canonical URL set in its historical discovery manifest; aliases are accounted in the full manifest outcomes.
- `API records discovered` is the public API product count when an API discovery surface exists. An Cường has no API discovery surface, so this is `UNAVAILABLE`, not zero. A measured empty API response would be written as `0`.
- `Unique SKUs`, `Product families`, and `Catalogue-only records` are normalized compact-index record classes. They must not be added to source URL outcomes.
- `Imported` is the full manifest outcome named `imported` (including imported family/document rows), not the number of unique compact records. `Noindex` and `Indexable` are compact-index SEO states and are intentionally independent of `Imported`.
- `Rejected` is an explicit policy roll-up: removed + invalid + non-product for An Cường (250 + 110 + 85 = 445), non-product for Thanh Thuỳ (16), and non-product for Ba Thanh (45). Duplicate and redirect outcomes remain accounted aliases, not unresolved records.
- `Unresolved` counts manifest rows without an accepted outcome. Every current supplier is zero; a non-zero value blocks publication.
- A numeric zero means the source was inspected and no rows of that type were found. `UNAVAILABLE` means that discovery surface does not exist or was not provided, and must never be silently converted to zero.

## Source Outcome Reconciliation

| Supplier | Manifest total | Imported | Duplicate | Redirected | Removed | Invalid | Non-product | Accounted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| An Cường | 6,241 | 2,975 | 2,821 | 0 | 250 | 110 | 85 | 6,241 / 6,241 |
| Thanh Thuỳ | 402 | 64 | 0 | 322 | 0 | 0 | 16 | 402 / 402 |
| Ba Thanh | 717 | 665 | 7 | 0 | 0 | 0 | 45 | 717 / 717 |

## SEO Status Reconciliation

| Supplier | `READY_TO_INDEX` | `NOINDEX_USEFUL` | `NEEDS_ENRICHMENT` | `SOURCE_ONLY` |
| --- | ---: | ---: | ---: | ---: |
| An Cường | 0 | 2,745 | 136 | 19 |
| Thanh Thuỳ | 1 | 9 | 338 | 5 |
| Ba Thanh | 6 | 70 | 227 | 2 |
| Total | 7 | 2,824 | 701 | 26 |

Only `READY_TO_INDEX` records whose concrete routes are owned by the supplier adapter can be indexable. Search/filter variants, sparse families, source-only documents, and enrichment-needed records remain outside the sitemap.

## Search Index

`data/catalogs/supplier-search-index.json` is the generated compact search contract.

- Records: 3,558.
- Checksum: `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`.
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

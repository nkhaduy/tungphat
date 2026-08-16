# An Cường Full Import Report

## Result

- Audit artifact date: 2026-08-06.
- Full source manifest: `data/imports/an-cuong/full-source-manifest.json`.
- Source URLs accounted: 6,241 of 6,241 (100%).
- Searchable records: 2,900.
- Record mix: 2,745 SKU, 136 family, 19 document.
- Search-index supplier total: 2,900.
- Indexable compact records: 0.

The full import replaces the former seven-record sample as the canonical catalogue source. Source URL accounting, imported searchable records, and public indexability are separate measures: 6,241 manifest rows reconcile discovery; 2,900 unique records power search; no individual An Cường compact record is promoted as an indexable detail page.

## Source Accounting

| Outcome | Count | Meaning |
| --- | ---: | --- |
| `imported` | 2,975 | Source rows linked to canonical SKU, family, or document evidence |
| `duplicate` | 2,821 | Locale aliases or repeated discovery paths mapped to an existing record |
| `removed` | 250 | Source URLs no longer serving a valid detail page |
| `invalid` | 110 | URLs resolving to non-product content where product evidence was expected |
| `non-product` | 85 | Category, catalogue, or discovery infrastructure accounted without creating products |
| Total | 6,241 | Every discovered URL has an explicit outcome |

Page-type accounting is 5,863 product URLs, 272 product-family URLs, 74 category URLs, 21 catalogue URLs, and 11 unknown/infrastructure URLs.

## Removed And Rejected Evidence

- 187 sitemap URLs resolve to the supplier custom 404 page.
- 110 sitemap URLs resolve to a non-product page and are classified invalid.
- 63 removed detail URLs retain only the public SKU evidence still present on live relation cards.
- 44 category sitemap URLs are discovery surfaces.
- 30 category listing URLs are discovery surfaces.
- 11 infrastructure URLs are accounted separately.

Relation-only SKUs are retained as records because a current public source still exposes the code. The importer does not claim the removed detail URL is live, and it does not fabricate names, prices, inventory, dimensions, or availability.

## Search And Route Policy

All 2,900 records are available to the server-side compact catalogue search. Their status mix is 2,745 `NOINDEX_USEFUL`, 136 `NEEDS_ENRICHMENT`, and 19 `SOURCE_ONLY`.

Only the An Cường hub plus curated `melamine`, `laminate`, and `acrylic` category routes are owned by the adapter. Non-curated material records link to `/catalogue/an-cuong/`. This avoids generating thousands of sparse detail pages or links to unimplemented category routes.

## Media

- Media manifest assets: 7,266.
- Media manifest checksum: `951da19323fbbb544372a3556210649d51c743824f5fddc71b75e89f33b058f8`.
- Broad original downloads: deferred where capacity or source rate limits apply.
- Rights status: `UNCONFIRMED`.

The public UI uses only verified files under `public/`. When no verified local swatch exists, the UI says so instead of repeating a supplier logo or hotlinking an unverified source image.

## Integrity Checks

- Manifest checksum: `3455fd409fbae89421aaf4001db3938d94f4e7758dc1f76a425be118d3cc5999`.
- Compact index contribution: 2,900 unique IDs.
- Search-index source inputs: 2,682 normalized catalogue records, 63 relation-only SKUs, 136 families, and 19 documents.
- No sample label or seven-record canonical fallback remains in the full catalogue path.

# Thanh Thuỳ Full Import Report

## Result

- Audit artifact date: 2026-08-06.
- Full source manifest: `data/imports/thanh-thuy/full-source-manifest.json`.
- Source URLs accounted: 402 of 402 (100%).
- Public WooCommerce products: 348.
- Searchable records: 353.
- Record mix: 339 SKU, 9 family, 5 document.
- Second import: created 0, updated 0, unchanged 348.

The 353 searchable records are not an alternative public product count. They comprise 348 public product records normalized into 339 coded SKUs and 9 code-less families, plus 5 source-only catalogue/document pages.

## Source Accounting

| Outcome | Count | Meaning |
| --- | ---: | --- |
| `imported` | 64 | Canonical public products, categories, collections, documents, and API evidence |
| `redirected` | 322 | Sitemap aliases verified to redirect to canonical public product URLs |
| `non-product` | 16 | Sitemap/API discovery infrastructure or public pages outside catalogue scope |
| Total | 402 | Every discovered URL has an explicit outcome |

Page-type accounting is 348 product URLs, 26 categories, 7 collections, 5 catalogue pages, and 16 unknown/infrastructure URLs. The 322 aliases retain redirect-chain and canonical destination evidence; slug similarity alone is not accepted.

## Record Quality And Indexability

| SEO status | Count | Public policy |
| --- | ---: | --- |
| `READY_TO_INDEX` | 1 | Eligible under the current supplier adapter policy |
| `NEEDS_ENRICHMENT` | 338 | Searchable but not promoted as indexable |
| `NOINDEX_USEFUL` | 9 | Useful family-level evidence without invented SKU codes |
| `SOURCE_ONLY` | 5 | Catalogue/document evidence only |

The nine code-less products remain family records and are never assigned generated codes. The five source-only records preserve four catalogue page URLs and the public Color Map URL; no contact form was submitted and no downloadable file is claimed.

## Media

- Media manifest assets: 290.
- Media manifest checksum: `92035ceae4a4d59aa32fb6aa074a013bbca6672b19be29ba9788a3fbaf1069dc`.
- Local preview references are capacity-safe derivatives, not proof of complete original-media custody.
- Rights status: `UNCONFIRMED`.

## Integrity Checks

- Full manifest checksum: `c980583478f32ad5ca34d3acaed51950f43966dad2a5604e82671f7ecd376925`.
- Full record checksum: `cc8f4516aae65495df166bc07b2d596ced15da2cd43e1b391c906aac6c52f7d1`.
- Compact search-index source checksum: `43ad240aacac09e83640ff50d98db0aad077ab495baef47de0671ea1b89aac6a`.
- Existing import evidence records identical first/second catalogue checksums and zero second-run mutations.

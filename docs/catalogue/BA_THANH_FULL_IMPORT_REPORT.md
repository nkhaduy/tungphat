# Ba Thanh Full Import Report

## Result

- Audit artifact date: 2026-08-06.
- Full source manifest: `data/imports/ba-thanh/full-source-manifest.json`.
- Source URLs accounted: 717 of 717 (100%).
- Searchable records: 305.
- Record mix: 292 SKU, 11 family, 2 document.
- Retained Melamine detail codes: 233.
- Existing second import evidence: created 0, updated 0, unchanged 305.

The supplier total is broader than the retained Melamine detail catalogue. The compact index adds source-backed product families, documents, and non-Melamine SKUs while preserving the 233 existing public Melamine code routes.

## Source Accounting

| Outcome | Count | Meaning |
| --- | ---: | --- |
| `imported` | 665 | Source URLs with catalogue, product, family, document, or collection evidence |
| `duplicate` | 7 | Repeated source paths normalized to an existing record/family |
| `non-product` | 45 | Corporate, service, API, pagination, robots, or sitemap infrastructure |
| Total | 717 | Every discovered URL has an explicit outcome |

Page-type accounting is 562 product URLs, 20 product-family URLs, 40 catalogue URLs, 9 collection URLs, and 86 unknown/infrastructure URLs. Imported source rows are not equivalent to unique records: multiple pages can support the same normalized family or SKU.

## Record Quality And Routing

| SEO status | Count | Public policy |
| --- | ---: | --- |
| `READY_TO_INDEX` | 6 | Retained Melamine details eligible under the existing policy |
| `NOINDEX_USEFUL` | 70 | Searchable supporting records without indexable expansion |
| `NEEDS_ENRICHMENT` | 227 | Searchable but not promoted as indexable |
| `SOURCE_ONLY` | 2 | Official catalogue/document evidence only |

Expanded records with a retained Melamine code link to their existing detail route. Records in the legacy `van-go`, `don-sac`, `van-da`, or `van-vai` groups link to the corresponding group route. Other expanded records link to the Ba Thanh hub. No new thin detail page is generated solely because a record is searchable.

## Media

- Media manifest assets: 326.
- Media manifest checksum: `7e48ef6ba83f1f047eff6241325d7343458f92c1b442979f70a0f61f02e99414`.
- Capacity-safe local previews do not imply complete original-media coverage.
- Rights status: `UNCONFIRMED`.

## Integrity Checks

- Full manifest checksum: `fd7c1f4ef5e634f60f82966eba2c620734162417dc3204ed8c8d824b4b087998`.
- Compact search-index source checksum: `6d5f1a69b31c1e4d72c0b88bcaae7f10c5147200486fd3e416064a357c6769f9`.
- Searchable records and retained Melamine routes are counted separately in the generated index totals.
- No price, stock, availability, or supplier authorization claim is inferred from public source evidence.

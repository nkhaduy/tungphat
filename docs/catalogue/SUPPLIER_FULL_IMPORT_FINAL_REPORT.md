# Supplier Full Import Final Report

## Outcome

The full catalogue artifacts account for 7,360 public source URLs across An Cường, Thanh Thuỳ, and Ba Thanh and expose 3,558 unique searchable records. The former seven-record An Cường sample limit is removed from the canonical path. Search coverage expands without automatically expanding indexability or creating sparse detail pages.

## Delivered Catalogue

| Supplier | Accounted source URLs | Searchable records | SKU | Family | Document | Indexable records |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| An Cường | 6,241 | 2,900 | 2,745 | 136 | 19 | 0 |
| Thanh Thuỳ | 402 | 353 | 339 | 9 | 5 | 1 |
| Ba Thanh | 717 | 305 | 292 | 11 | 2 | 6 |
| Total | 7,360 | 3,558 | 3,376 | 156 | 26 | 7 |

Source coverage is fully reconciled through explicit imported, duplicate/redirected, removed, invalid, and non-product outcomes. Searchable record totals are deduplicated entities and must not be added to manifest outcome counts.

## Public Route Policy

- An Cường claims the supplier hub and curated `melamine`, `laminate`, and `acrylic` routes; other material records route to the hub. All 2,900 records remain non-indexable.
- Thanh Thuỳ keeps 348 public WooCommerce products distinct from 353 searchable SKU/family/document records. Only one compact record currently has `READY_TO_INDEX`.
- Ba Thanh preserves 233 retained Melamine detail codes while the broader 305-record catalogue uses existing detail, group, or hub routes. Six retained records are indexable.
- Search/filter variants and source-only/sparse records remain outside the sitemap.

## Data Integrity

- Combined compact search-index checksum: `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`.
- Search-index generation is deterministic and rejects duplicate record IDs.
- Supplier full manifests account for every discovered URL.
- Existing supplier import evidence reports zero created/updated records on second runs.
- No fake code, price, stock, availability, or supplier authorization claim is introduced.

## Media Boundary

The capacity-safe media manifest covers 10,654 references and 7,923 unique URLs with 589 local preview references, 525 checksum-deduplicated files, and 80,357,860 local bytes. It also records 6,209 original-only and 3,856 unresolved/deferred references. Broad An Cường originals remain deferred where capacity or source rate limits apply.

All rights remain `UNCONFIRMED`. This work does not assert complete original-media custody or production publication rights.

## Verification Boundary

Fresh verification passes Vitest (413 tests), Playwright (62 tests), lint, application/Cloudflare typecheck, production build, links, sitemap, supplier output audit, JSON-LD/canonical audit, media validation, deterministic search-index regeneration, secret checks, and diff checks. Mobile Lighthouse scores are 90/100/100/100 for the homepage, 90/100/100/100 for the catalogue hub, and 96/100/100/100 for the An Cường Melamine route (performance/accessibility/best practices/SEO).

Detailed commands, outputs, and the initial stale-test/a11y findings corrected during verification are recorded in `.superpowers/sdd/full-catalogue-import/task-5-report.md`. Preview deployment, pushing, and production mutation are outside Task 5.

## Residual Concerns

- Media rights require separate legal/editorial confirmation.
- Capacity-safe previews do not replace complete original-media review.
- Sparse/source-only records require editorial enrichment before any future indexability expansion.
- The compact search artifact is approximately 1.7 MiB and must remain scoped away from the homepage/global shell.

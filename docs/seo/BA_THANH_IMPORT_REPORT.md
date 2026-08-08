# Ba Thanh Melamine Import Report

## Batch identity

- Supplier: Ba Thanh
- Product family: Melamine
- Source index: `https://bathanh.com.vn/map-ma-melamine`
- Source crawl completed: `2026-08-05T09:59:30.756Z`
- Catalogue base commit: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Import target: local source-controlled JSON and `public/catalog/ba-thanh/`; no CMS or production mutation

## Discovery result

| Metric | Result |
| --- | ---: |
| Detail URLs discovered | 233 |
| Parsed successfully | 233 |
| Redirected | 0 |
| Failed | 0 |
| Rejected | 0 |
| Unique normalized codes | 233 |
| Duplicate source codes | 0 |
| Duplicate rows | 0 |

Discovered groups were read from the source DOM rather than assumed from URL prefixes:

| Group | Codes |
| --- | ---: |
| Vân gỗ | 153 |
| Đơn sắc | 62 |
| Vân đá | 13 |
| Vân vải | 5 |

Detail URLs include root-level routes such as `/bt184`, `/bt-111-wood-grains` and `/sc028`. The crawler follows only links discovered inside the Melamine catalogue panels and then validates the visible detail heading against the expected code.

## Import result

The first local import created 233 records. Later controlled migrations intentionally updated all 233 records to add dedicated grid thumbnails and replace raw-page checksums with checksums of stable parsed facts. The final idempotency run produced:

| Metric | Final second import |
| --- | ---: |
| Created | 0 |
| Updated | 0 |
| Unchanged | 233 |
| Skipped | 0 |
| Duplicates | 0 |
| Invalid | 0 |
| Needs enrichment | 227 |
| Missing media | 0 |
| Duplicate media | 0 |
| Ready to index | 6 |

The import keeps source-derived fields separate from Tùng Phát editorial fields. Existing editorial descriptions, applications, publish state and SEO status are preserved on repeat imports.

## Media result

- 241 full-size local WebP files: 233 primary swatches plus 8 accepted detail/application images.
- 233 local grid thumbnails, maximum 480px wide.
- 474 committed media files in total, approximately 49 MB; thumbnails account for approximately 5.9 MB.
- Full images use the `webp-1200-q92-thumb480-q92-v2` pipeline variant, max dimension 1200px, no upscaling and no saturation/contrast/white-balance adjustment.
- MIME and dimensions are read by Sharp; unsupported, broken or undersized images are rejected.
- Every frontend image path begins with `/catalog/ba-thanh/`; no Ba Thanh image is hotlinked.

## Indexability result

The six records with local media and distinct editorial value are `BT111`, `BT143`, `BT184`, `BTS14G`, `SC028M` and `SC029M`. They are `READY_TO_INDEX`, published, linked from server-rendered HTML and included in sitemap output.

The remaining 227 records stay accessible for user lookup but use `noindex,follow`, are excluded from the sitemap and remain `NEEDS_ENRICHMENT`. The importer does not manufacture long descriptions, stock state, price, availability, technical performance or authorization claims.

## Validation result

- Catalogue validation: 233 records, 6 indexable, 227 noindex, 0 errors, 0 warnings.
- Duplication audit: 233 records, 0 high-overlap findings.
- Static output: 239 unique titles, 239 unique meta descriptions, 239 self canonicals and valid JSON-LD on 239 Ba Thanh pages.
- Sitemap: 12 Ba Thanh URLs; brand page, hub, four groups and six indexable code pages.
- Internal orphan audit: 0 indexable Ba Thanh pages without an incoming HTML link.

## Source handling notes

The pipeline stores only structured facts and minimal parsed text needed for provenance/debugging. It excludes source navigation, footer, company introduction, contact details, tracking code and unrelated pages. Robots.txt returned HTTP 200 and allowed every requested public catalogue/media path; rules are enforced before fetch and across redirects. No CAPTCHA, login, rate-limit bypass or authenticated endpoint was used.

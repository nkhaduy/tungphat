# Thanh Thuy Import Report

Import completed locally on 2026-08-05T02:43:50.325Z. No production API, CMS, database, or deployment target was mutated.

## Discovery

- Public product records: 348.
- Public category URLs: 26.
- Top-level material groups: 6.
- Unique source image URLs: 341.
- Source records with substantive body content: 2.

## Import result

- Imported: 348.
- Updated: 0.
- Skipped/unchanged on first import: 0.
- Duplicate product records: 0.
- Local content-hash images: 286.
- Local optimized image directory: `public/catalog/thanh-thuy/` (856 WebP variants, about 65 MB).
- `READY_TO_INDEX`: 1.
- `NEEDS_ENRICHMENT`: 347.
- `MEDIA_MISSING`: 0.
- `DATA_INVALID`: 0.
- `DUPLICATE`: 0.
- `SOURCE_UNAVAILABLE`: 0.
- Catalogue checksum: `e44907478b33c0db25c1f95a5cc3dc25487d69b91efa038af752d9b664703ced`.

## Idempotency check

A second dry run against the same source snapshot returned:

- Created: 0.
- Updated: 0.
- Unchanged: 348.
- Catalogue checksum unchanged.

## Indexing decision

Only `LP 101/104G White` (`LP 101/104G`) currently meets the product-level quality gate. The remaining records are still useful for code/image lookup and contact conversion, but are emitted with `noindex` and excluded from sitemap until they have reliable code/technical content and original enrichment.

Category and brand landing pages provide indexable discovery for Melamine, Laminate, Acrylic, PVC Film, Veneer and plastic edge banding without turning sparse source records into hundreds of thin indexed pages.

## Media handling

- Supplier images were downloaded to cache, decoded with Sharp, resized only downward, stripped of unnecessary metadata, converted to WebP, and deduplicated by content checksum.
- Public pages reference local `/catalog/thanh-thuy/*.webp` paths only.
- No source-domain image hotlink is present in the normalized catalogue.
- Image colors were not enhanced or AI-modified.

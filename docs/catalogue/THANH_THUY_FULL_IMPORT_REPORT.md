# Thanh Thuỳ Full Import Report

## Result

- Audit date: 2026-08-06.
- Previous public product records: 348.
- Current WordPress REST product records: 348 across four pages (`100 + 100 + 100 + 48`).
- Current non-empty product categories: 26.
- Product sitemap URLs: 348 across two product sitemaps.
- Exact canonical sitemap/API URL matches: 26.
- Sitemap aliases that publicly redirect to the canonical REST product URL: 322.
- Product URL HTTP checks: 348 final `200`, 322 with a verified redirect chain, 0 failed.
- Newly discovered product records: 0.
- Removed from the public source: 0.
- Updated product records: 0.
- Unchanged product records on the second import: 348.

## Normalized Records

- SKU records with a public supplier code: 339.
- Family records without an invented code: 9.
- Source-only document records: 5.
- Total normalized records: 353.
- `READY_TO_INDEX`: 1.
- `NEEDS_ENRICHMENT`: 338.
- `NOINDEX_USEFUL`: 9.
- `SOURCE_ONLY`: 5.

The nine code-less source products remain searchable family-level source records. They are not assigned generated SKUs. The five source-only records cover the four public catalogue pages and the public Color Map page. Each page requires contact/form interaction to obtain a downloadable document, so the importer does not submit the form and does not claim that a PDF was downloaded.

## Catalogue Sources

1. `https://www.gothanhthuy.com/catalog/osb-faced-melamine-2025/`
2. `https://www.gothanhthuy.com/catalog/mfc-woodgrain-collection-2025/`
3. `https://www.gothanhthuy.com/catalog/finger-joint-board-2025/`
4. `https://www.gothanhthuy.com/catalog/melamine-decor-exquisite-2024/`
5. `https://www.gothanhthuy.com/colormap/`

All five records use `SOURCE_ONLY`, require editorial review, and preserve the official source URL. No form was submitted.

## Coverage

- Full source manifest: `data/imports/thanh-thuy/full-source-manifest.json`.
- Discovered URLs accounted: 402 of 402.
- Coverage: 100%.
- Imported/canonical source URLs: 64.
- Redirected sitemap aliases: 322.
- Non-product discovery infrastructure/pages: 16.
- Invalid: 0.
- Blocked unaccounted URLs: 0.

The manifest retains the exact parent sitemap for every product URL and records each public REST pagination request. Redirected aliases include the final HTTP status, redirect chain evidence, exact canonical product URL, evidence checksum, and normalized record ID. Slug similarity alone is never accepted as redirect evidence.

## Media

- Unique public source image URLs: 341.
- Unique local primary image references after checksum deduplication: 286.
- Local responsive media files: 856.
- Local media footprint: approximately 56 MB.
- Rights status: `UNCONFIRMED`.

The second import reuses complete local responsive variants, preserves each official source image URL, and does not hotlink public UI assets. The existing WebP conversion policy still needs the cross-supplier color-fidelity review documented in the final media strategy before production approval.

## Verification

- Focused Thanh Thuỳ tests: passed.
- TypeScript typecheck: passed.
- Catalogue validation: 348 products and 26 categories valid.
- Full manifest/record validation: passed.
- First import: created 0, updated 0, unchanged 348.
- Second import: created 0, updated 0, unchanged 348.
- Catalogue checksum on both runs: `8e5050a67ef2fa9812a001dad263d3ed209fee86c8c663c7e262b14359dd3eee`.
- Full manifest checksum: `c980583478f32ad5ca34d3acaed51950f43966dad2a5604e82671f7ecd376925`.
- Full record checksum: `cc8f4516aae65495df166bc07b2d596ced15da2cd43e1b391c906aac6c52f7d1`.

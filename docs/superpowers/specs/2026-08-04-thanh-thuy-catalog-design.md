# Thanh Thuy Catalogue Design

## Goal

Create an original, searchable Thanh Thuy catalogue for Tùng Phát that helps buyers find material codes, request stock/quotes, and discover cutting, edge-banding, and CNC services without cloning the supplier site or publishing thin pages.

## Architecture

The catalogue is a normalized static data set imported from the public Thanh Thuy catalogue endpoint and sitemap scope. `scripts/thanh-thuy/` owns discovery, crawl caching, normalization, image processing, import, validation, and rollback. `data/catalogs/thanh-thuy/catalog.json` is the publishable contract; `.cache/thanh-thuy/` is ignored and resumable.

The existing Next.js static-export architecture remains in place. A dedicated brand route provides the landing page and filterable catalogue. Category/series routes live under `/san-pham/`. Product routes are nested under their category and include stable code-aware slugs. Existing brand routes continue to work for other brands, while the Thanh Thuy route gets a dedicated canonical URL.

## Indexing policy

Every discovered record is normalized and validated, but indexability is a quality decision:

- `READY_TO_INDEX`: required identity, category, local image, original description, useful application guidance, CTA, canonical, and unique metadata.
- `NEEDS_ENRICHMENT`: useful for on-site filtering/detail lookup but noindex until a human adds missing facts.
- `MEDIA_MISSING`, `DATA_INVALID`, `DUPLICATE`, `SOURCE_UNAVAILABLE`: excluded from sitemap and visibly reported.

The current source has only two records with detailed technical bodies, so the initial indexable set is intentionally small. Category pages carry the broader discovery burden while code pages remain accessible and searchable.

## Data flow

1. `discover` reads robots, sitemap index, product/category sitemaps, and public taxonomy metadata; it writes a source manifest.
2. `crawl` fetches public product JSON in four paginated requests with cache, retry, backoff, and resume state.
3. `normalize` extracts safe facts (code, name, category, series, color/pattern signals, dimensions/thickness when explicitly present, image URLs, source URL, source checksum) and rewrites copy for Tùng Phát.
4. `import` deduplicates by source URL/code/checksum, downloads and optimizes images into local content-hash paths, writes the catalogue, and records an import report. A dry run performs all validation without publishing files.
5. `validate` checks data, image paths, route uniqueness, quality statuses, source attribution, metadata inputs, and absence of source-domain hotlinks.

## Content and SEO

The brand page introduces the supplier relationship in Tùng Phát's own words, lists material groups, explains stock/quote support, and links to cutting, edge-banding, and CNC services. Category pages have distinct introductions, material characteristics, applications, selection guidance, FAQs, breadcrumbs, and quote CTAs. Product pages show only sourced facts plus clearly labelled Tùng Phát service guidance; inventory is always “Liên hệ kiểm tra tồn kho”.

Metadata is generated from the normalized record and route, with self-referencing canonical URLs, Open Graph/Twitter images, `Product`/`BreadcrumbList`/`ItemList` JSON-LD, and no fake prices or availability. Filter/search state stays client-side so it cannot create a query crawl trap. Sitemap includes only canonical 200 indexable routes.

## Error handling and persistence

Network errors are retried with exponential backoff and cached pages are reused. A failed crawl does not delete the last successful catalogue. Import writes a timestamped backup before replacing data. `--rollback latest` restores the previous catalogue and removes only media listed as created by that import.

## Testing

Vitest covers normalization, code/slug dedupe, quality classification, retry/cache behavior, idempotent import, route mapping, metadata uniqueness, structured-data restrictions, and no-hotlink guarantees. Build-time validators cover the exported sitemap, internal links, canonical URLs, and static output. Playwright/axe checks cover mobile search/filter interaction, keyboard focus, empty/error states, and core catalogue pages.

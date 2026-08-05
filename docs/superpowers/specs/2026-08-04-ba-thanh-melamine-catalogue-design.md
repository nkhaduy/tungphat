# Ba Thanh Melamine Catalogue Design

## Outcome

Build a source-auditable, static-export-compatible catalogue for Ba Thanh Melamine codes on mdftungphat.com. The feature helps users find a code, understand its source group, and send a precise inquiry to Tùng Phát for substrate, sizing, edge banding and CNC services without claiming authorization or stock.

## Architecture

The system has two isolated layers. A CLI import layer discovers the public index, recognizes only catalogue-linked detail pages, normalizes facts, downloads and verifies local media, and writes deterministic JSON reports. A website layer reads only the normalized publish dataset at build time and generates server-rendered brand, collection, category and eligible detail pages.

The catalogue core is supplier-agnostic: types, normalization helpers, repository selectors, grid/search components, disclaimer and inquiry CTA accept supplier data. The Ba Thanh source adapter owns domain whitelisting, DOM markers, source categories and media naming.

## Data flow

1. Discover fetches robots.txt and the configured index with a transparent user-agent.
2. The index parser identifies category panels from DOM headings, then extracts anchor/image pairs only from those panels.
3. Detail crawl uses bounded concurrency, retry/backoff, timeout and cache. A page is accepted only when its URL came from the index and its heading or content contains a matching Melamine code.
4. Normalize retains `codeRaw`, derives a conservative `codeNormalized`, and flags ambiguity instead of merging uncertain SC suffix variants.
5. Media import downloads the primary swatch and eligible detail images, validates magic bytes with Sharp, hashes bytes, deduplicates and writes high-quality WebP without color enhancement or upscaling.
6. Import merges source fields by supplier/code/source URL while preserving editorial fields. Missing source pages never delete published records.
7. Validate and duplication audit generate deterministic reports used by tests and documentation.

## Website routes

- `/thuong-hieu/ba-thanh/`: original Tùng Phát brand/service page.
- `/ma-mau-melamine/ba-thanh/`: searchable collection hub.
- `/ma-mau-melamine/ba-thanh/{van-go|don-sac|van-da|van-vai}/`: unique category landings when data exists.
- `/ma-mau-melamine/ba-thanh/[code]/`: static code route. Imported thin records render noindex; only `READY_TO_INDEX` records enter sitemap output.

All canonical URLs use trailing slashes through the existing Next configuration. Search/filter query states canonicalize to their base collection route and are not emitted in sitemap output.

## User experience

The hub renders a server-side initial grid with real links. A small client component provides normalized code search, category filtering, pagination, copy feedback and empty states. Code remains visible as text; categories are never conveyed only by swatch color. Images use responsive sizes, lazy loading except a page LCP image, explicit aspect ratios and a broken-image fallback.

Zalo links prefill a code-specific message using URL encoding when supported, while call and quote-form links use Tùng Phát business configuration. Every code view includes a material-color disclaimer and a request to verify a physical sample.

## SEO and structured data

The hub/category pages use WebPage/CollectionPage, BreadcrumbList and ItemList. Eligible detail pages use Product with only visible, factual fields: name, sku, brand, category, image, description and URL. No fake Offer, price or availability is added. Commercial FAQ content is visible but FAQPage markup is not added solely for Google rich results.

Metadata is original, code-specific and validated for duplicate titles/descriptions. Source URLs remain provenance fields and never become canonicals. Thin pages are noindex and excluded from sitemap.

## Error handling and safety

Only HTTPS requests to `bathanh.com.vn` and its media host are accepted. Redirects are revalidated against the whitelist. Arbitrary CLI URLs are rejected. Cache and partial reports allow resume. Failed source fetches preserve the last valid import and produce `SOURCE_UNAVAILABLE`; they do not delete or unpublish records.

No raw source HTML is rendered or committed. Minimal cached HTML lives in a gitignored cache directory. Source text is escaped and stored as structured facts only.

## Testing

Unit tests cover normalization, URL whitelist, category extraction, deduplication, sitemap eligibility and Zalo message encoding. Integration tests cover deterministic dry-run/import and a second import with zero creates/unexpected updates/duplicates. Build-output checks cover canonical, robots, sitemap, JSON-LD, noindex and internal links. Playwright covers desktop/mobile search, filters, keyboard focus, copy feedback and CTA URLs when the local app can run.

## Approval note

The user explicitly requested autonomous implementation without stopping after audit or planning. This written design is therefore treated as the approved implementation contract for this run.

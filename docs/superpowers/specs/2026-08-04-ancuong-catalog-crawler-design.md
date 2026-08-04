# An Cuong Catalogue Crawler Design

## Scope

Build an isolated, HTTP-first crawler and data pipeline for the public An Cuong material catalogue rooted at `https://ancuong.com/online-catalogue/catalogue-vat-lieu.html`. The branch exports reviewable source datasets only; it adds no public routes, SEO pages, production mutations, deployment changes, or Thanh Thuy pipeline coupling.

## Source Strategy

The catalogue root is server-rendered and links to material categories on `ancuong.com` plus Publitas catalogues on `catalogue.ancuong.com`. Product category pages are the authoritative discovery layer: they contain complete product cards, numeric detail IDs, product codes, image URLs, and facet option keys. Product detail pages are also server-rendered and expose factual facets, application media, product-line blocks, dimension/thickness tables, and explicit `Dong Mau` related-product cards. Publitas `spreads.json` is retained as supporting audit evidence, not used as the primary product feed. Browser automation is unnecessary for normal crawling.

## Architecture

The pipeline is split into commands for `discover`, `crawl-listings`, `crawl-details`, `crawl-relations`, `download-media`, `normalize`, `validate`, `diff`, `export`, and `report`. Focused TypeScript modules own HTTP, HTML parsing, stable serialization, state/checkpoints, normalization, validation, diffing, media, exports, and CLI routing. Each network fetch stores sanitized metadata and compact source fragments rather than repeated site chrome.

Canonical writes are atomic and stable-sorted. Runtime caches, full raw responses, state, and downloaded media are ignored; review fixtures, manifests, reports, schemas, and sample exports are committed. Conditional requests use ETag/Last-Modified where supplied. Default concurrency is 3, retry is capped at 3, timeout is 25 seconds, and request delay uses conservative jitter. A 403, 429, CAPTCHA, challenge, or block stops the affected run safely without bypass.

## Data Contract

The normalized product retains source identifiers, canonical URL, source/display product code, normalized code, discovered category and facets, factual/technical data, source marketing classification, media, explicit relations, hashes, timestamps, parser version, warnings, and lifecycle status. Same-color relations are created only from the detail page's explicit `product-map` section. Dimension/thickness matrices are parsed from line-specific tables and preserve non-authoritative notes as technical warnings.

## Testing

Vitest unit tests cover product-code normalization, category/listing/detail/facet parsing, dimension matrices, relations, images, dedupe, diff, retry, resume, and atomic writes. Integration tests use compact saved fixtures and never require live network access. `catalog:ancuong:test:live` performs a small smoke test. The sample command covers Melamine, Laminate, Acrylic, edge banding, collection/surface facets, and multi-dimension technical data where the live source exposes it.

## Operational Safety

No cookies, access tokens, browser profiles, contact forms, personal data, or production credentials are persisted. Marketing copy is classified `reference-only` or `requires-rewrite`; factual and technical fields are `technical-data`. Missing products are marked for review and never deleted automatically. Media is never hotlinked in final integrations, but this branch commits only a manifest and tiny fixtures, not the full media library.

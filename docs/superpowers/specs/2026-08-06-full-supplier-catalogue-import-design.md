# Full Supplier Catalogue Import Design

## Goal

Build an offline, resumable and auditable import system that accounts for every public product source discovered for An Cuong, Thanh Thuy and Ba Thanh, while keeping production unchanged until media rights are confirmed.

## Evidence And Scope

- The rollout base is `98be2e84d4c8d019d04464784fd05048b7bd239d` on `codex/main-sitewide-catalog-rollout`.
- An Cuong previously had 2,682 normalized/exported records at commit `de2a4d1`, then the sample runner rewrote shared `details.json`, normalized output and export output with seven records.
- A fresh 2026-08-06 listing crawl finds 30 An Cuong listing categories and 2,678 product URLs. Three processing-service categories and four product URLs from the previous snapshot are no longer present.
- Thanh Thuy currently exposes 348 public WooCommerce product records, 26 non-empty product categories and a public catalogue section. Its Bricks infinite-load request is not the authoritative source; the public WordPress REST collection and sitemaps are.
- Ba Thanh exposes 233 Melamine detail URLs plus public family pages for MDF/HDF/HMR, joined boards, Dongwha flooring, OKAL/MFC, Melamine-faced boards, Veneer-faced boards, paper-faced boards and Veneer/PVC edge banding.

## Architecture

Each supplier pipeline has four explicit layers: discovery, crawl, normalization/import and validation/reporting. Discovery combines robots, sitemaps, HTML links, JSON-LD, public REST/XHR responses and official catalogue documents. Every discovered URL is stored with provenance and an accounted outcome, so completeness is measured from the manifest rather than a hard-coded expected product count.

Normalized output uses a discriminated `CatalogueRecord` union for SKU, family and document records. Supplier adapters consume the normalized records and produce a compact search index plus only the routes that are useful to render. Sparse records remain searchable and noindex without forcing thousands of static pages.

Sample mode is isolated under sample-only paths and cannot write canonical normalized/export artifacts. Full mode is the only mode allowed to refresh production-consumed catalogue data, and validation rejects a catalogue whose accounted coverage is incomplete or whose An Cuong full output is not larger than the representative sample.

## Data Flow

1. Fetch robots and declared sitemap locations using HTTPS-only supplier allowlists.
2. Discover category, collection, product, family and catalogue-document URLs from independent sources.
3. Canonicalize locale variants and retain provenance for every source occurrence.
4. Crawl all pages/API pages with cache, retry, backoff, bounded concurrency and checkpoints.
5. Normalize verified facts into SKU, family or document records without inventing codes, prices or inventory.
6. Download referenced public media to supplier namespaces, preserving bytes and recording rights as `UNCONFIRMED`.
7. Validate identity, source URLs, media, idempotency, search coverage, category reconciliation and accounted coverage.
8. Generate supplier reports, the combined coverage report and the client search dataset.
9. Build and deploy only a Cloudflare Pages preview from the feature branch.

## Completeness Model

`coveragePercentage = accountedDiscoveredRecords / totalDiscoveredRecords`. Accounted outcomes are imported, duplicate, redirected, removed, non-product, invalid-with-reason or blocked-with-evidence. An empty reason or an unaccounted discovered URL is a hard validation failure.

Locale routes supplement fields but do not create duplicate records. SKU identity prefers public source product ID, then normalized code plus canonical URL. Family records never receive fabricated codes. Catalogue-document records remain editorial-review candidates when the document contains verifiable codes but incomplete specifications.

## UI And SEO

The catalogue hub and supplier pages use data-derived material filters. Search ranking is exact normalized code, exact code/name, prefix, supplier/family/category, demand score, partial match and alphabetical tie-break. The homepage imports only a compact summary; the full search dataset stays scoped to catalogue routes.

Supplier hubs and useful category pages can be `READY_TO_INDEX` after deterministic SEO checks. Sparse SKU and document-only records remain `NOINDEX_USEFUL`, `NEEDS_ENRICHMENT` or `SOURCE_ONLY`. Noindex routes never enter the sitemap, and no page canonicalizes to a supplier website.

## Safety

- Official supplier hosts only, HTTPS only, bounded redirects and loop detection.
- No authentication, CAPTCHA bypass, form submission, account creation or private API access.
- No hotlinks and no image enhancement or color-changing transforms.
- Media rights stay `UNCONFIRMED`; preview only, no main merge or production catalogue deployment.
- Build never crawls suppliers; all crawling is an explicit offline command.

## Verification

The implementation follows test-first changes for sample isolation, pagination, manifests, normalization, search and UI. Final verification includes format, lint, typecheck, Vitest, Playwright, production build, link/sitemap/canonical/JSON-LD/accessibility/Lighthouse audits, second-run idempotency and secret scanning.

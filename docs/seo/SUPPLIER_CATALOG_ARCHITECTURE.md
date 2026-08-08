# Supplier Catalogue Architecture

## Design goals

- Keep supplier discovery, crawl, normalization, import, taxonomy, quality gates, editorial content, route generation, SEO policy, media, and validation independent.
- Share only stable contracts for registry, search results, sitemap entries, metadata, breadcrumbs, media, and catalogue UI primitives.
- Preserve existing public routes and supplier-specific data without forcing product, color-code, and crawler-export records into one schema.

## Shared core

`lib/catalog/core/` owns supplier-agnostic contracts and pure functions:

- `types.ts`: `SupplierId`, `SupplierDefinition`, `SupplierCatalogRecord`, `CatalogMedia`, `CatalogSeoStatus`, `CatalogSearchEntry`, and `CatalogSitemapEntry`.
- `registry.ts`: registered supplier definitions and lookup by stable supplier ID.
- `search.ts`: normalization and ranking with exact-code priority.
- `sitemap.ts`: canonical/indexable-only composition with duplicate detection.
- `routes.ts`: stable canonical route validation and supplier ownership checks.

The core must not import crawler code, large JSON into client components, or supplier-specific record unions beyond adapter boundaries.

## Supplier adapters

- `lib/catalog/suppliers/thanh-thuy.ts`: adapts products, categories, indexability, search entries, sitemap entries, and routes from the Thanh Thuy catalogue.
- `lib/catalog/suppliers/ba-thanh.ts`: adapts Melamine codes and four groups while preserving the 6 indexable / 227 noindex policy and 12 sitemap URLs.
- `lib/catalog/suppliers/an-cuong.ts`: adapts the existing brand/catalogue route and requested crawler export schema without inventing offers, ratings, or availability.

Crawler/import implementations remain in `scripts/<supplier>/` and are called by package scripts. Adapters consume validated local outputs; they do not execute network operations during page rendering.

## UI boundaries

Generic presentation moves under `components/catalog/shared/` only when the same behavior is used by at least two suppliers. Supplier-specific explorers and detail views remain in their existing namespaces. Shared JSON-LD builders accept brand data and never hardcode a supplier.

## Search

Search entries expose supplier, record kind, code, name, thumbnail, canonical route, category, series, and optional group. Normalization supports exact code, compact code, and hyphen variants. Ranking is exact code, normalized code, prefix, name, then taxonomy. Every result route is validated against its owning supplier.

Search/filter state is client-side or query-driven with `noindex,follow`; query URLs never enter the sitemap.

## Sitemap and robots

The website sitemap composes existing website entries with supplier adapter entries. The composition rejects duplicates, non-canonical paths, noindex records, search/filter paths, and conflicting supplier ownership. Robots keeps the existing website rules and avoids blocking pages that need page-level noindex discovery.

## Security and operations

Crawler HTTP clients use explicit public-domain allowlists, URL validation, response-size limits, MIME validation, bounded concurrency, and local-only output. No production write API is called. Media provenance and rights confirmation remain a deployment blocker.

## Verification strategy

- Preserve all supplier tests.
- Add failing cross-supplier tests before shared-core implementation.
- Verify catalogue counts, index/noindex gates, route ownership, exact-code search, sitemap composition, title suffixes, canonical output, JSON-LD brand isolation, import idempotency, and media integrity.
- Run scoped lint, full typecheck, supplier tests, full tests, production build, static HTML/link/metadata audits, and local Lighthouse checks.

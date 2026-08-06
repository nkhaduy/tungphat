# Task 4 report — complete supplier search, taxonomy, UI and SEO

## Status

`DONE_WITH_CONCERNS`

Task 4 replaces the seven-record An Cường adapter with the complete canonical supplier import, commits a compact deterministic search artifact, reconciles public routes and SEO gates, and keeps the complete normalized An Cường source out of client and homepage imports.

## Source-to-index mapping

| Supplier | Canonical sources | Indexed records |
| --- | --- | ---: |
| An Cường | `normalized/catalogue.json`, `relation-only-products.json`, `product-families.json`, `documents.json` | 2,900 total: 2,745 SKU, 136 family, 19 document |
| Thanh Thuỳ | `data/imports/thanh-thuy/full-records.json` | 353 total: 339 SKU, 9 family, 5 document |
| Ba Thanh | `data/imports/ba-thanh/full-records.json` | 305 total: 292 SKU, 11 family, 2 document; 233 retained Melamine detail codes |
| Combined | Generated from all sources above | 3,558 unique records |

Every source record receives one stable compact-index ID. Family and document records retain an empty `code` and do not receive `normalizedCode`. Exact normalized-code matches rank ahead of name, prefix, taxonomy, demand and partial matches.

## Generated artifact

- Artifact: `data/catalogs/supplier-search-index.json`
- Generator: `scripts/catalog-suppliers/build-search-index.ts`
- Size: 1,807,624 bytes, compared with the approximately 28 MiB normalized An Cường catalogue source.
- Content checksum: `7384674a2104f1937b9908f3be76b7d4220ae2e937127389f0bd4b84271a5c0f`
- Determinism: two consecutive generator runs produced byte-identical output, command output and file SHA-256.
- Loading boundary: catalogue server routes/adapters import the compact artifact. Homepage and global shell do not import either the artifact or the normalized An Cường source.

## Public route and SEO decisions

- The An Cường hub remains a noindex search/list route.
- Only `/catalogue/an-cuong/melamine/`, `/catalogue/an-cuong/laminate/`, and `/catalogue/an-cuong/acrylic/` are statically generated and included in the sitemap.
- Those three routes have distinct editorial introductions, application guidance, selection guidance, self-canonicals, CollectionPage/ItemList JSON-LD and BreadcrumbList JSON-LD.
- ItemList entries use source names and real identifiers without emitting many ListItems that repeat the category canonical URL.
- Other non-empty An Cường taxonomy route claims are explicitly non-indexable and remain outside the sitemap; direct non-curated category rendering resolves to not-found.
- Sparse/source-only records route to an owned hub/category page. No An Cường SKU detail route was invented.
- The static build produced only the three curated An Cường category routes, and the generated sitemap contains exactly those three An Cường paths.

## UI and copy changes

- Replaced `AnCuongSampleSearch` with `AnCuongCatalogueSearch` using the full compact entries, ordered non-empty material filters, 48-card progressive reveal, real formats and Tùng Phát inquiry actions.
- Code text/copy actions render only when a real code exists. Family/document cards use their record identity and code-free accessible labels.
- Supplier totals on the catalogue hub are derived from the artifact and distinguish retained Ba Thanh detail codes from expanded import totals.
- Removed sample-only wording from the requested catalogue, partner, homepage and Thanh Thuỳ public components.
- Preserved legacy Ba Thanh groups (`van-go`, `don-sac`, `van-da`, `van-vai`) while adding the shared material taxonomy to catalogue URL state.

## RED evidence

Initial command:

```bash
npm test -- --run tests/full-catalogue-search-index.test.ts tests/supplier-navigation-sitemap.test.ts
```

Failed because `lib/catalog/suppliers/search-index` did not exist, the combined search index had only 588 records, and no An Cường category sitemap route existed.

Public copy/UI command:

```bash
npm test -- --run tests/catalogue-view.test.ts tests/catalogue-public-copy-boundary.test.ts tests/an-cuong-category-route.test.ts
```

Failed because `AnCuongCatalogueSearch` and the An Cường category route did not exist and public sample-only wording remained.

Adapter regression command:

```bash
npm test -- --run tests/supplier-catalog-core.test.ts tests/catalogue-hub-layout.test.ts tests/ba-thanh-seo.test.ts tests/catalogue-view.test.ts tests/thanh-thuy-seo-integration.test.ts tests/thanh-thuy-routes.test.ts
```

Failed on stale 348/233/7 adapter counts and Ba Thanh merchandising order (`BT 184` before `BT 111`).

Curated SEO command:

```bash
npm test -- --run tests/an-cuong-category-route.test.ts tests/supplier-navigation-sitemap.test.ts
```

Failed because all 13 non-empty An Cường material categories were indexable/generated, category copy was generic, BreadcrumbList was absent, and all 24 ItemList entries repeated one category canonical URL.

## GREEN and verification evidence

```text
npm test -- --run <12 Task 4 catalogue/SEO/UI files>
12 files passed, 71 tests passed

npm run catalog:suppliers:test
37 files passed, 254 tests passed

npm test
67 files passed, 406 tests passed

npm run lint
passed with zero warnings

npm run typecheck
application and Cloudflare TypeScript checks passed

npm run build
production build and postbuild passed; 635 static routes generated before cleanup
Cloudflare Pages capacity PASS: 2,672 files, largest file 2,170,167 bytes
sitemap validation PASS: 39 canonical/indexable URLs
metadata validation PASS: 12 checked URLs

git diff --check
passed
```

The sample-copy boundary scan returned no matches in the requested public components.

## Changed areas

- Compact artifact/generator: `data/catalogs/supplier-search-index.json`, `scripts/catalog-suppliers/build-search-index.ts`, `lib/catalog/suppliers/search-index.ts`, `package.json`.
- Search/taxonomy/types: `lib/catalog/material-taxonomy.ts`, `lib/catalog/an-cuong-categories.ts`, `lib/catalog/core/search.ts`, `lib/catalog/core/types.ts`, `lib/catalog/url-state.ts`.
- Supplier adapters: `lib/catalog/suppliers/an-cuong.ts`, `ba-thanh.ts`, `thanh-thuy.ts`, `search.ts`.
- UI/routes/copy: An Cường category route and search component, shared catalogue search, catalogue hub/view, partner/home and Thanh Thuỳ copy.
- Tests: full compact index, An Cường category route, public copy boundary, supplier sitemap/core and catalogue view coverage.

## Concerns

- Media rights remain `UNCONFIRMED`; this task performed no live crawl or media download.
- The compact artifact is approximately 1.8 MiB. It is deliberately limited to catalogue server-route usage and is not imported by the homepage/global shell.
- Expanded Ba Thanh records without retained public detail pages intentionally open existing category/hub pages.
- An Cường sparse/source-only records intentionally do not receive thousands of thin public detail pages.

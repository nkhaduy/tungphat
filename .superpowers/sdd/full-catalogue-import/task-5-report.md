# Task 5 Report: Documentation And Full Verification

## Outcome

`DONE_WITH_CONCERNS`

The seven requested catalogue documents were created/reconciled from the committed manifests and generated compact search index. Full verification passes after correcting one real An Cường contrast regression and stale browser/schema expectations from the former seven-sample route policy. No live supplier crawl, broad media download, preview deployment, DNS change, or production mutation occurred.

Residual concerns are limited to the existing boundaries: all supplier media rights remain `UNCONFIRMED`, capacity-safe previews are not complete original-media custody, and sparse/source-only records must remain non-indexable until separately enriched and reviewed.

## Documentation Delivered

- `docs/catalogue/AN_CUONG_SAMPLE_LIMIT_ROOT_CAUSE.md`
- `docs/catalogue/AN_CUONG_FULL_IMPORT_REPORT.md`
- `docs/catalogue/THANH_THUY_FULL_IMPORT_REPORT.md`
- `docs/catalogue/BA_THANH_FULL_IMPORT_REPORT.md`
- `docs/catalogue/SUPPLIER_FULL_CATALOGUE_COVERAGE.md`
- `docs/catalogue/SUPPLIER_FULL_IMPORT_RUNBOOK.md`
- `docs/catalogue/SUPPLIER_FULL_IMPORT_FINAL_REPORT.md`

The documents use the actual An Cường manifest path `data/imports/an-cuong/full-source-manifest.json`, correcting the stale `data/imports/ancuong/full-source-manifest.json` spelling from earlier planning text. The legacy `data/imports/ancuong/` directory remains valid only for older pipeline artifacts explicitly stored there.

## Coverage Evidence

| Supplier | Source URLs | Outcomes | Searchable records |
| --- | ---: | --- | ---: |
| An Cường | 6,241 | 2,975 imported; 2,821 duplicate; 250 removed; 110 invalid; 85 non-product | 2,900 |
| Thanh Thuỳ | 402 | 64 imported; 322 redirected; 16 non-product | 353 |
| Ba Thanh | 717 | 665 imported; 7 duplicate; 45 non-product | 305 |

Combined coverage is 7,360/7,360 source URLs and 3,558 unique searchable records. Searchability, source accounting, and indexability are reported separately. Only 7 compact records are indexable under current policy: 1 Thanh Thuỳ and 6 Ba Thanh; all 2,900 An Cường records remain non-indexable.

## Verification Findings And Fixes

The first full Playwright run completed with 57 passes and 5 failures:

1. Axe found the An Cường no-swatch label at 4.46:1 contrast against a required 4.5:1.
2. The sitemap E2E used substring matching that treated curated An Cường category routes as the noindex supplier hub.
3. The homepage supplier-card E2E still expected “xem dữ liệu mẫu”.
4. The shared filter E2E still expected the retired legacy `Vân gỗ` control on the material-taxonomy search.
5. The An Cường E2E still expected seven samples and the old search/region labels.

The minimal fix changes the no-swatch label from `text-slate-500` to `text-slate-600`, preserves route/indexability behavior, and updates stale E2E assertions to the 2,900-record/48-result-page/current taxonomy UI. The sitemap assertion now checks exact `<loc>` values and explicitly requires the three curated An Cường category routes.

The static schema audit initially reported zero structural errors but failed frozen pre-full-catalogue hashes and a hardcoded 36-URL sitemap count. The current verified hashes were recorded after the 39-URL build; the brittle count assertion was replaced with duplicate-free sitemap validation while `check-sitemap-output.mjs`, the sitemap hash, and route-level E2E retain exact coverage enforcement.

## Fresh Gate Results

- `npm test`: 67 files, 413 tests passed.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: application and Cloudflare TypeScript checks passed.
- `npm run build`: 635 static pages generated; postbuild produced 2,672 files/207,577,181 bytes, largest file 2,108,160 bytes; Cloudflare file/count gates passed; sitemap 39 URLs; metadata 12 URLs.
- `npm run validate:links`: 624 HTML files, 19,695 internal links, 14,523 relationships, 326 targets, zero redirects, zero HTTP errors, zero missing trailing slashes; 39 sitemap URLs passed.
- `npm run catalog:suppliers:audit:output`: 598 supplier pages, 23 indexable, 575 noindex, 598 unique titles, 592 unique descriptions, 598 canonicals, zero invalid JSON-LD, zero brand mismatches, zero orphan indexable pages.
- `node scripts/check-schema-urls.mjs --out out`: 622 routes, 1,249 JSON-LD blocks, 8,993 schema nodes, zero parse errors, zero canonical mismatches, zero forbidden offer/price/rating/review fields, zero redirect/HTTP errors, 39 duplicate-free sitemap URLs.
- `npm run catalog:suppliers:media:validate`: passed; An Cường 7,266 assets, Ba Thanh 326, Thanh Thuỳ 290; all committed manifest checksums validated.
- `npm run test:e2e`: 62/62 Playwright tests passed in 1.2 minutes, including Axe accessibility, mobile/zoom/overflow, supplier search/filter journeys, sitemap, schema, noindex, and Web Vitals lab checks.
- `npm test -- --run tests/ancuong/pipeline-validate.test.ts tests/full-catalogue-search-index.test.ts`: 2 files, 20 tests passed, including An Cường secret-field rejection and complete compact-index reconciliation.
- High-confidence literal credential scan: no private-key blocks, AWS access keys, GitHub personal tokens, or OpenAI-style secret tokens found.

## Determinism And Idempotency

`npm run catalog:suppliers:search-index` was run twice. Both runs produced 3,558 records with artifact checksum `33047ad2c53b7d793a8242b80ae5880574d47bb153f634e1f67472d0a05062a2`. The file SHA-256 remained `8261c3b1f76dfbbe657fb686ae96bc9465e6d249a78e92c2ded753a74fff2b33` before and after the second run.

Committed supplier import evidence remains:

- Thanh Thuỳ second import: created 0, updated 0, unchanged 348.
- Ba Thanh second import: created 0, updated 0, unchanged 305.
- An Cường deterministic reconciliation is enforced by canonical coverage validation and the full compact-index test; no live import was rerun because Task 5 explicitly prohibited live crawls/downloads.

## Lighthouse

Lighthouse 12.8.2 ran sequentially in mobile mode with local Google Chrome against the built static artifact served by the existing Wrangler test server.

| Route | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 90 | 100 | 100 | 100 | 3.7 s | 0 | 30 ms |
| `/catalogue/` | 90 | 100 | 100 | 100 | 3.4 s | 0 | 150 ms |
| `/catalogue/an-cuong/melamine/` | 96 | 100 | 100 | 100 | 2.7 s | 0 | 20 ms |

The local server was stopped after the audits. Lighthouse JSON was written only to `/tmp` and was not added to the repository.

## Media Boundary

Capacity-safe media remains 10,654 references, 7,923 unique URLs, 589 local preview references, 525 checksum-deduplicated files, 80,357,860 bytes, 6,209 original-only references, and 3,856 unresolved/deferred references. All rights remain `UNCONFIRMED`.

## Final Repository Checks

- `git diff --check`: recorded after final report generation.
- `progress.md` remains parent-owned and is excluded from staging.

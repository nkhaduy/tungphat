# Supplier Catalogue Integration Final Report

Date: 2026-08-05

## Integration

- Branch: `codex/catalog-suppliers-integration`
- Worktree: `/Users/khaduy/Downloads/tungphat-supplier-catalog-integration`
- Integration base: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`
- Final implementation commit before this report: `0216663` (`fix(security): validate An Cuong crawler redirects`)
- Final report commit: use the branch HEAD returned by `git rev-parse HEAD`; the report itself is part of that commit.

## Source snapshots

- Thanh Thuy: `5565f4035115e47c75b53a70545a649bf2e6fe00..280ad65f62cc9013b0f478dd0978679d8b2df311`
- Ba Thanh: `5565f4035115e47c75b53a70545a649bf2e6fe00..6675ac7f5788229d91e1cbf70cda24f7dff79e8b`
- An Cuong: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4..6d158c1c566e9b2f24cd56284c3cf09e27258b11`
- Eleven later An Cuong full-crawl commits remain intentionally excluded because the request pinned `6d158c1`.

## Catalogue and indexability

| Supplier   | Categories |                 Records |                                                          Indexable policy |                                                          Noindex policy |
| ---------- | ---------: | ----------------------: | ------------------------------------------------------------------------: | ----------------------------------------------------------------------: |
| Thanh Thuy |         26 |            348 products | 1 product plus brand and 6 routed category pages; 8 supplier sitemap URLs |                                                     347 product records |
| Ba Thanh   |          4 |               233 codes |    6 codes plus brand, hub and 4 category pages; 12 supplier sitemap URLs |                                                        227 code records |
| An Cuong   |         33 | 7 exported sample items |                                      0 item routes in the pinned snapshot | One noindex catalogue route; all 7 sample items stay behind that policy |

The complete website sitemap contains 35 unique canonical URLs. Supplier output audit covers 595 route claims: 20 indexable and 575 noindex.

## Import idempotency

- Thanh Thuy dry-run and two real local imports: `created 0`, `updated 0`, `unchanged 348`; catalogue SHA-256 remained `e44907478b33c0db25c1f95a5cc3dc25487d69b91efa038af752d9b664703ced`.
- Ba Thanh dry-run and two real local imports: `created 0`, `updated 0`, `duplicates 0`, `unchanged 233`.
- An Cuong media/validate/export ran twice: catalogue export SHA-256 `3529d940ab33eedafc210296b27afbd398c67220b8fc9cff4f4e7fe353e9f4f4`; media export SHA-256 `05a3541c3d33596ac83fc0362ac3d5d48d2e58e96e6b71ff1041d86b84ad065c`; both runs matched.
- An Cuong media manifest: 20 records, 13 downloaded binaries/checksums, 7 duplicate references, 0 missing, 0 invalid and 0 failed.

## SEO and route audit

- Supplier pages: 595; unique titles: 595; unique descriptions: 589.
- Duplicate indexable titles/descriptions: 0.
- Canonicals checked: 595; invalid JSON-LD: 0; brand mismatches: 0.
- Internal-link audit: 621 HTML files, 28,673 internal links, 17,009 relationships, 0 broken/redirect relationships and 0 trailing-slash errors.
- Sitemap: 35 unique canonical HTTP-200 outputs, 0 duplicates, 0 noindex entries and 0 canonical mismatch.
- Orphan indexable supplier pages: 0.
- Remaining duplicate descriptions are confined to five noindex Thanh Thuy edge-band pages and three noindex veneer pages.
- An Cuong Lighthouse SEO is 69 because its pinned catalogue route deliberately emits noindex. Canonical, title, H1 and structured output pass the deterministic audits; removing noindex solely to raise Lighthouse would violate the source quality policy.

## Performance and accessibility

Mobile Lighthouse, local production export:

| Route               | Performance | Accessibility | Best Practices | SEO |    LCP | CLS |
| ------------------- | ----------: | ------------: | -------------: | --: | -----: | --: |
| Homepage            |          93 |           100 |            100 | 100 | 3.25 s |   0 |
| Thanh Thuy hub      |          95 |           100 |            100 | 100 | 2.88 s |   0 |
| Ba Thanh hub        |          95 |           100 |            100 | 100 | 2.89 s |   0 |
| An Cuong catalogue  |          97 |           100 |            100 |  69 | 2.65 s |   0 |
| Thanh Thuy category |          96 |           100 |            100 | 100 | 2.71 s |   0 |
| Thanh Thuy product  |          97 |           100 |            100 | 100 | 2.65 s |   0 |
| Ba Thanh category   |          94 |           100 |            100 | 100 | 3.14 s |   0 |
| Ba Thanh code       |          96 |           100 |            100 | 100 | 2.76 s |   0 |

The Ba Thanh hub exceeds the requested performance target of 90 and meets the requested LCP target of 3.0 seconds. Four focused Playwright/axe routes pass with no serious or critical accessibility violations.

## Quality gates

- Full ESLint: pass with zero warnings.
- Typecheck: pass for website and Cloudflare configurations.
- Vitest: 43 files, 259/259 tests pass.
- Focused Playwright accessibility: 4/4 pass.
- Production build: pass; 632 static pages generated.
- Static output, sitemap, metadata and link audits: pass.
- Supplier validators and output audit: pass.
- Formatting: new integration documents and new accessibility test pass Prettier. The repository has no format script; inherited one-line JSX and the pre-existing An Cuong HTTP client/test fail a repository-wide Prettier check both before and after the integration, so no mass formatting rewrite was performed.

## Security

- Secret scan: no exposed credential or private-key material; the two pattern hits are environment-driven private-key parsers, not embedded keys. Only `.env.example` is tracked.
- JSON-LD escapes `<` before `dangerouslySetInnerHTML`; no raw supplier HTML is rendered.
- Thanh Thuy, Ba Thanh and An Cuong use supplier-specific URL allowlists.
- An Cuong now requires HTTPS and validates every redirect manually with hop/cycle limits before the next request, closing the cross-host redirect SSRF path found during integration review.
- Media inspection validates binary signatures, MIME/dimensions and rejects HTML challenge bodies.
- `npm audit --omit=dev`: 0 critical/high and 2 moderate PostCSS/Next advisories. Resolving them requires the explicitly excluded Next 16 upgrade.
- Full dependency audit also reports three high transitive development-tool advisories (`brace-expansion`, `fast-uri`, `undici`) and four moderate advisories. They do not affect the exported static runtime and remain dependency-maintenance debt rather than catalogue code changes.

## Media

- Thanh Thuy: 856 local WebP files, 0 missing local references and 0 hotlinks.
- Ba Thanh: 474 local WebP files, 0 missing local references and 0 hotlinks.
- An Cuong: 13 ignored runtime JPEG binaries for 20 manifest records, plus the existing local public brand fallback.
- Duplicate media: two byte-identical Ba Thanh pairs retained under stable paths; seven An Cuong duplicate references reuse valid checksums; no cross-supplier path or case collision.
- Rights status: unconfirmed for all supplier imagery.

**Production deployment blocked pending media usage confirmation.**

## Safety and deployment

- Original workspace modified by this integration: no.
- Existing An Cuong worktree modified by this integration: no.
- Reset, clean, stash, restore or force operations: none.
- Existing sessions interrupted: none.
- Push: not performed.
- Main merge: not performed.
- Production mutation: none.
- Production deployment: not performed.

## Remaining technical debt

- Obtain written media usage confirmation before deployment.
- Enrich the eight duplicate-description Thanh Thuy noindex pages before any indexability promotion.
- Plan dependency-only remediation for current npm advisories without folding a Next 16 migration into this catalogue integration.
- The pinned An Cuong snapshot exposes one noindex catalogue route rather than item/category detail routes; expanding public routes requires a separate content-quality and data-rights decision.

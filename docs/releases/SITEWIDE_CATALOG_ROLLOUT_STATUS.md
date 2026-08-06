# Sitewide Catalogue Rollout Status

Date: 2026-08-06

## Release Boundaries

- Original main and pre-landing rollback: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`
- Landing source: `2e5d6f7f9e0002e08d050e1f26f275073aa3c24f`
- Landing release: `a698153655667b44cdd14c831f751666c127ee0b`
- Landing production deployment: `466dea89-ab39-4f3f-b94b-90f5e0e4bae4`
- Catalogue source: `53a3e44f1be94af2225c3a65e1813b1292a3bda2`
- Catalogue merge boundary: `52ee5c3`
- Rollout branch: `codex/main-sitewide-catalog-rollout`
- Rollout worktree: `/Users/khaduy/Downloads/tungphat-main-rollout`

## Catalogue Integration

- Shared shell: `SiteShell`, `SiteHeader`, `SiteFooter`, shared page primitives and tokens
- Legacy catalogue chrome: none
- Hub order: breadcrumb, concise H1, search, primary selectors, Melamine results, supplier cards, support content
- URL state: `query`, `type`, `group`, `supplier`; legacy `q` and `category` remain readable
- Exact-code behavior: normalized exact code ranks first and Enter opens a unique exact result
- Default merchandising: Melamine and explicit demand scores first; alphabetical order is the last tie-breaker
- Ba Thanh demand source: indexability/editorial readiness, category demand, verified media and record completeness
- Filter-state SEO: `noindex, follow`, canonical to the stable hub/category, excluded from sitemap

## Data And SEO

- Thanh Thuy: 26 categories, 348 products
- Ba Thanh: 4 groups, 233 codes, 6 indexable code pages, 227 noindex code pages
- An Cuong: 33 source categories, 7 sample items, noindex catalogue route
- Static pages built: 632 before sentinel cleanup
- Supplier pages audited: 595
- Supplier indexable pages: 20
- Supplier noindex pages: 575
- Sitemap URLs: 36
- Invalid JSON-LD: 0
- Canonical mismatches: 0
- Broken internal links: 0

## Local Quality Evidence

- Formatting for changed files: pass
- ESLint: pass
- TypeScript: pass
- Vitest: 306/306 pass
- Playwright: 62/62 pass
- Production build: pass
- Schema URL audit: pass, 0 errors
- Empty listing/indexability audit: pass
- Secret scan over changed files: pass
- Production dependency audit: no high or critical findings; two moderate Next/PostCSS advisories require a breaking Next 16 upgrade and remain maintenance debt

## Lighthouse Mobile

| Route                        | Performance | Accessibility | Best Practices | SEO | CLS |
| ---------------------------- | ----------: | ------------: | -------------: | --: | --: |
| `/catalogue/`                |          94 |           100 |            100 | 100 |   0 |
| `/thuong-hieu/thanh-thuy/`   |          95 |           100 |            100 | 100 |   0 |
| `/ma-mau-melamine/ba-thanh/` |          95 |           100 |            100 | 100 |   0 |
| `/catalogue/an-cuong/`       |          98 |           100 |            100 |  69 |   0 |

An Cuong remains intentionally `noindex`; its lower Lighthouse SEO score is not a release defect and must not be fixed by removing the policy.

## Production Gate

- Catalogue media rights: `UNCONFIRMED`
- Catalogue preview: allowed
- Catalogue production deployment: blocked
- DNS/custom domain changes: prohibited and not required
- Paid service activation: prohibited and not required
- Rollback target for any future catalogue production release: `a698153655667b44cdd14c831f751666c127ee0b`

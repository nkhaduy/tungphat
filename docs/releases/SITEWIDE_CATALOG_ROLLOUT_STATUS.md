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
- Catalogue pull request: `#17` (draft, production merge blocked by media rights)

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

## Catalogue Preview Evidence

- Cloudflare Pages deployment: `74c58717-e810-4368-b765-0775be998189`
- Commit preview: `https://74c58717.tungphat-i9i.pages.dev`
- Branch preview: `https://codex-main-sitewide-catalog.tungphat-i9i.pages.dev`
- GitHub checks: `verify`, `e2e`, Cloudflare Pages, Vercel and Vercel Preview Comments all pass
- Preview catalogue Playwright profile: 32/32 pass across supplier journeys, accessibility, exact-code search, copy, Zalo, noindex behavior and the requested viewport matrix
- Required route smoke test: 6/6 HTML routes return HTTP 200; `sitemap.xml` and `robots.txt` return HTTP 200
- Sampled preview assets: CSS, JavaScript, logos, icons and eight leading Ba Thanh WebP swatches return HTTP 200
- Browser audit: shared header/footer present, no horizontal overflow, no broken rendered images and no console errors on required routes
- Catalogue hub: search and primary selectors precede product and supplier sections; default results begin with `BT 111`, `BT 143`, `BT 184`, `SC 028M`, `SC 029M`, `BTS 14G`
- Search/filter behavior: exact `BT 111` returns one leading result, URL state and browser back work, and filter state emits `noindex, follow`
- Mobile: 390x844 search height is 56px, category chips scroll horizontally, mobile menu locks body scroll and Escape restores the closed state
- An Cuong: seven sample cards remain visible, search precedes cards and `noindex, follow` is preserved
- Ba Thanh detail: approved code-specific Zalo message, copy live-region confirmation and inventory-check wording verified without an availability claim

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
- Catalogue preview deployment: passed
- Catalogue production deployment: blocked
- DNS/custom domain changes: prohibited and not required
- Paid service activation: prohibited and not required
- Rollback target for any future catalogue production release: `a698153655667b44cdd14c831f751666c127ee0b`

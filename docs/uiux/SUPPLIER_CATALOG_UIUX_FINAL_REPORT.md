# Supplier Catalogue UI/UX Final Report

Date: 2026-08-05

Branch: `codex/catalog-suppliers-uiux-review`

Base commit: `ca939b0dcfe5abb7e3361c6370b64531e66f8e9a`

## Outcome

The catalogue now supports supplier-first and code-first discovery without changing route ownership, structured data, sitemap membership, import pipelines, or indexability policy. The main conversion path is: identify supplier/code, verify the visual and material context, copy or send the exact code, then ask Tùng Phát to confirm board type, dimensions, stock, quotation, and fabrication.

## Highest-impact changes

- Homepage, header, footer, and partner cards lead to the live Thanh Thuỳ, Ba Thanh, and An Cường experiences.
- The central hub explains supplier scope and surface-versus-core selection before exposing results, while keeping search first on mobile.
- Exact code search accepts spacing/case/hyphen variants; exact supplier queries show a single supplier hub; ambiguous codes never auto-open an arbitrary supplier.
- Ba Thanh query/category state survives detail navigation, browser history, and reload.
- Supplier and code labels remain visible text throughout cards, details, copy actions, breadcrumbs, and inquiry messages.
- Ba Thanh and Thanh Thuỳ details surface copy/Zalo actions early and require stock/specification confirmation.
- An Cường renders seven text-first approved sample records, retains `noindex`, and does not expose blocked media.
- Legacy noindex supplier routes remain usable and direct customers to the live canonical catalogue.
- Mobile navigation has one catalogue group, background scroll lock, Escape/focus restoration, usable touch targets, and no horizontal overflow in the requested matrix.

## Findings resolved

- P0: 1 local-browser rendering blocker.
- P1: 6 discovery, mobile, conversion, and trust issues.
- P2: 7 taxonomy, state, route-handoff, message, and accessibility issues.
- P3: Visual alignment was handled within the above fixes; no decorative redesign was introduced.

The issue-level record, evidence, fix, and verification method are in `docs/uiux/SUPPLIER_CATALOG_UIUX_AUDIT.md`.

## Browser and device evidence

The local production export was operated in the Codex in-app browser. Representative before/after screenshots cover the catalogue hub, Thanh Thuỳ hub/detail, Ba Thanh hub/search/detail, An Cường page, mobile menu, and mobile search/filter.

Automated viewport coverage includes:

- Desktop: 1440x900 and 1280x800.
- Tablet: 768x1024.
- Mobile: 390x844, 375x667, and 360x800.
- Additional interaction checks: keyboard-only, Escape/focus restoration, reduced motion, rotation, 200% zoom, JavaScript disabled, browser back/forward, reload, long/special queries, clipboard state, Zalo URL encoding, and noindex page usability.

## Performance evidence

Historical integration baseline supplied for this review:

| Route      | Performance | Accessibility | Best Practices | SEO |   LCP | CLS |
| ---------- | ----------: | ------------: | -------------: | --: | ----: | --: |
| Thanh Thuỳ |          95 |           100 |            100 | 100 | 2.88s |   0 |
| Ba Thanh   |          95 |           100 |            100 | 100 | 2.89s |   0 |
| An Cường   |          97 |           100 |            100 |  69 | 2.65s |   0 |

Controlled same-machine Lighthouse 12.8.2/Chrome 150 comparison against the integration static export:

| Route      | Before perf | After perf | Before LCP | After LCP | Before TBT | After TBT | A11y/BP/SEO after |
| ---------- | ----------: | ---------: | ---------: | --------: | ---------: | --------: | ----------------- |
| Thanh Thuỳ |          65 |         77 |     3.585s |    4.225s |     1103ms |     332ms | 100/100/100       |
| Ba Thanh   |          77 |         83 |     3.270s |    3.156s |      634ms |     433ms | 100/100/100       |
| An Cường   |          72 |         87 |     4.107s |    3.249s |      471ms |     279ms | 100/100/69        |

The first parallel Lighthouse attempt was discarded because CPU contention invalidated the comparison. Controlled sequential runs show higher performance scores for all three routes, stable CLS 0, and large TBT improvements. Thanh Thuỳ's lab LCP varied upward by 640 ms even as TBT improved; this is recorded rather than hidden. The An Cường SEO score remains 69 by intentional `noindex` policy.

Static HTML script-asset comparison:

- Catalogue hub: 557,499 to 562,235 raw bytes (+4,736; about 0.85%).
- Ba Thanh hub: 1,082,357 to 1,084,948 (+2,591).
- Thanh Thuỳ hub: 558,478 to 558,818 (+340).
- An Cường: 556,800 to 551,624 (-5,176).

The measured changes do not justify a separate performance refactor. Search still uses the existing 588-entry index; the interaction remains responsive in the tested production export.

## Trust and policy

- No price, stock, review, or official-distributor claim was added.
- Zalo URLs are inspected and tested without sending a message.
- Phone links are tested by `href` without placing a call.
- An Cường stays noindex and outside the sitemap.
- Screen color and inventory/specification disclaimers remain customer-facing and concise.
- Production deployment blocked pending media usage confirmation.

## Final quality gates

| Gate                       | Result                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prettier                   | Pass; all touched text files match project style                                                                                                       |
| Full lint                  | Pass; zero warnings                                                                                                                                    |
| Typecheck                  | Pass for application and Cloudflare configurations                                                                                                     |
| Vitest                     | 44 files, 276/276 tests passed                                                                                                                         |
| Playwright                 | 47/47 passed on the configured Cloudflare local test server                                                                                            |
| Accessibility              | Four supplier/homepage Axe routes passed with no serious violations; keyboard, focus, zoom, touch-target, reduced-motion, and viewport journeys passed |
| Production build           | Pass; 632 static pages generated before export cleanup                                                                                                 |
| Static output              | Pass; no legacy `0619.mp4` and no artifact over 24 MiB                                                                                                 |
| Internal links             | 621 HTML files, 25,533 links, 0 redirects, 0 HTTP errors, 0 missing trailing slashes                                                                   |
| Supplier output audit      | 595 supplier pages; 20 indexable, 575 noindex, 0 invalid JSON-LD, 0 brand mismatches, 0 orphan indexable pages                                         |
| Sitemap                    | 35 valid, unique, indexable canonical URLs                                                                                                             |
| Metadata/canonical         | 12 representative routes passed canonical, `og:url`, robots, and sitemap policy checks                                                                 |
| Secret/conflict/debug scan | No private-key/token pattern, conflict marker, added debug log, or tracked temporary test artifact found                                               |

## Retained limitations

- Lighthouse absolute scores in the local Chrome 150 environment do not reproduce the historical baseline, so the report uses same-machine before/after comparisons and retains the historical figures separately.
- The An Cường customer page intentionally exposes only seven text-first sample records until data scope and media usage are approved.
- Search loads the current lightweight static index client-side. No server filtering was introduced without evidence of a responsiveness problem.
- Production deployment remains blocked; this branch is for local review only.

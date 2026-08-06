# Sitewide Landing and Catalogue Rollout Design

## Objective

Release the approved landing/sitewide redesign first, verify it on production, then integrate the three-supplier catalogue into the same design system and customer journey. Catalogue production remains gated by media rights even when its code and preview pass every technical quality gate.

## Release Architecture

The rollout uses one isolated worktree and a branch with explicit phase boundaries. Phase 1 merges only the landing source, preserves current production infrastructure, and produces a production release. Phase 2 begins from the resulting `main`, merges catalogue data and behavior, then replaces catalogue presentation with the shared site shell before producing a preview.

The landing design system owns shared chrome, typography, spacing, colors, responsive containers, navigation, footer, page heroes, CTAs, empty states, and mobile actions. Catalogue-specific code owns supplier data, search normalization and ranking, filter state, product cards/details, structured data, sitemap/indexability policies, and deferred route-local search data.

## Catalogue Customer Journey

The catalogue hub opens with breadcrumb, concise H1, large code-first search, primary material/group selectors, popular groups, and then products. Supplier cards and supporting content follow the high-intent lookup controls. Default merchandising prioritizes Melamine and customer intent groups; alphabetical order is only a final tie-breaker.

Search normalizes spaces, hyphens, case, and Vietnamese supplier names. Exact normalized code ranks first. A unique exact code navigates directly to detail; ambiguous codes present supplier choices. URL query parameters retain meaningful search/filter state without generating crawlable sitemap entries.

## Ranking

First-party demand signals are used only if committed, non-sensitive, and suitable for runtime use. Otherwise a documented heuristic combines category demand, material intent, visual versatility, interior-use breadth, meaningful media, information completeness, editorial quality, business relevance, and recency. Labels avoid unsupported claims such as "bán chạy".

## SEO and Media Safety

The production canonical stays `https://mdftungphat.com`. Supplier and product `noindex` policies remain unchanged, noindex URLs stay out of sitemaps, query URLs are `noindex,follow`, and structured data continues to identify suppliers in text. An Cường remains an honest seven-item sample experience rather than pretending to be complete.

Catalogue media rights remain `UNCONFIRMED`. Preview deployment is allowed. Production catalogue deployment is prohibited until the owner explicitly confirms rights or accepts the usage scope; the code must not bypass this gate.

## Verification

Each phase must pass formatting where configured, lint, typecheck, Vitest, production build, static link/sitemap/canonical/JSON-LD audits, local Playwright, browser console and network checks, responsive overflow checks, accessibility checks, and deployment smoke tests. Landing production stability is a hard prerequisite for catalogue integration.

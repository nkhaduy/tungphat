# Ba Thanh Melamine Catalogue Baseline

## Git baseline

- Branch: `codex/catalog-ba-thanh-melamine-seo`
- Base commit: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Base subject: `Merge pull request #11 from nkhaduy/fix/cms-preview-security-headers`
- Remote baseline after fetch: `origin/main` at `ed07a2a`
- The branch intentionally starts from the requested local `main` HEAD, not from `codex/catalog-thanh-thuy-seo` and not from the newer remote commit.
- The working tree already contained unrelated modified and untracked CMS/homepage files. They must not be reverted, stashed, or included in Ba Thanh commits.

## Current architecture

- Framework: Next.js 15 App Router with React 19 and TypeScript strict mode.
- Rendering: static export (`output: "export"`) with `trailingSlash: true`.
- Package manager: npm with `package-lock.json`.
- Content: MD/JSON under `content/`, validated with Zod and loaded from Decap-compatible files or an optional Payload snapshot.
- CMS: Decap/Cloudflare CMS is the active repository-integrated content workflow; experimental Payload and Light CMS directories are present as unrelated local work.
- Media: public files under `public/`; Next Image is configured as unoptimized for static export.
- SEO: shared helpers in `lib/seo.ts`, root Organization/LocalBusiness/WebSite JSON-LD in `app/layout.tsx`, metadata routes in `app/sitemap.ts` and `app/robots.ts`.
- Deployment: Cloudflare Pages/static output configuration is present. This branch must not deploy or mutate production.
- Tests: Vitest, Playwright, content/image/static-output validators, ESLint, TypeScript and Next build.

## Existing catalogue and related routes

- `/san-pham/` lists material and brand placeholders.
- `/san-pham/[brand]/` is a generic brand placeholder route.
- `/catalogue/[brand]/` is a generic catalogue placeholder route.
- `/van-mdf/`, `/mdf-chong-am/`, `/van-go-cong-nghiep/` and `/gia-cong-cnc/` are relevant internal-link targets.
- No existing `/thuong-hieu/` or `/ma-mau-melamine/` route exists.
- No searchable color-code data model or index exists on the baseline.
- Existing Ba Thanh pages are thin placeholders and should not become the canonical target for the new color catalogue.

## Source baseline

- Index: `https://bathanh.com.vn/map-ma-melamine`
- Source robots.txt permits public pages and disallows only `/wp-admin/` except AJAX.
- The index DOM currently exposes four tabs: Mau van go, Mau don sac, Mau van da and Mau van vai.
- The corrected container-level DOM audit found 233 linked cards: 153 wood-grain, 62 solid-color, 13 stone and 5 fabric. The earlier quick count missed the first card in each accordion panel.
- Detail pages are not constrained to the index path. Examples include `/bt184`, `/bt-111-wood-grains` and `/sc028`.
- Source pages contain company navigation, contact details and footer content that must be excluded.

## Chosen schema

The catalogue will use a dedicated supplier-code schema stored outside the generic product CMS collection. Source-controlled fields and Tùng Phát editorial fields remain separate. The minimum key is supplier plus verified normalized code; raw code, source URL, source checksum and media checksum are retained for audit and deduplication.

Indexability is controlled by `seoStatus` and `published`. Imported codes with only a code and swatch remain `NEEDS_ENRICHMENT`/noindex. Only records that meet the local content and media gate become `READY_TO_INDEX` and enter sitemap output.

## Reuse and supplier-agnostic boundaries

- Reuse: Header, Footer, metadata helpers, JSON-LD renderer, business config, analytics links and visual tokens.
- Supplier-agnostic: code normalization, schema types, catalogue grid/card/search, material disclaimer, inquiry CTA, validation and sitemap selectors.
- Ba Thanh-specific: source whitelist, DOM recognition, source parser, category mapping, source disclaimer and imported dataset.
- The existing generic product schema is not extended with hundreds of source records; that would overload the CMS and generic product routes.

## SEO risks

- Cannibalization between `/catalogue/ba-thanh/`, `/san-pham/ba-thanh/`, `/thuong-hieu/ba-thanh/` and the new hub.
- Thin code pages if imported automatically without editorial value.
- Duplicate metadata at scale if code templates are not validated.
- Indexable filter/search combinations creating crawl traps.
- Source titles/descriptions leaking into Tùng Phát metadata.
- Incorrect claims about stock, authorization, performance or technical specifications.

Mitigation: the new brand page and hub use self-referencing canonicals and unique intent; legacy placeholders keep their current role and link contextually to the hub. Search/filter query states are noindex and canonicalize to the stable hub or category page. Only enriched records enter sitemap output.

## Duplicate-content risks

- Codes, dimensions, source grouping and factual brand fields may necessarily match the source.
- Source marketing paragraphs, company descriptions, navigation, contacts, titles and disclaimers must never be copied.
- Imported source text is stored only as structured facts and minimal debug fields, never as raw page HTML in the frontend bundle.
- Tùng Phát landing, category, service, FAQ, CTA and metadata copy must be original and useful for local purchasing and fabrication workflows.

## Thanh Thuy conflict risk

- Local branch `codex/catalog-thanh-thuy-seo` currently points to the same base commit and has a clean worktree.
- No shared supplier catalogue infrastructure has been committed on that branch at audit time.
- Potential future conflicts: `app/sitemap.ts`, `app/robots.ts`, header/footer internal links, shared catalogue components, global CSS and package scripts.
- Ba Thanh implementation must therefore be modular and avoid depending on unmerged Thanh Thuy work.

## Implementation plan

1. Add a rerunnable source discovery, detail crawl, normalization, media import, validation and duplication-audit pipeline.
2. Generate committed manifests/reports and optimized local swatches without hotlinks.
3. Add a typed catalogue repository that reads the imported data at build time.
4. Add brand, hub, category and selectively indexable detail routes.
5. Add client-side progressive search/filter over a lightweight index while retaining server-rendered links and content.
6. Add metadata, canonical, breadcrumb, CollectionPage/ItemList/Product JSON-LD and sitemap controls.
7. Add unit/integration/e2e-style route checks, idempotency validation, documentation and final reports.

## Files and behavior that must not change

- Existing unrelated homepage/CMS/Light CMS/Payload/quote-app changes.
- Production Cloudflare bindings, secrets, D1/R2 data or deployments.
- Existing customer content or generic product records outside contextual internal links.
- Source robots rules, authentication, CAPTCHA or rate-limit behavior.
- Source imagery color balance, saturation, contrast or white balance.

## Baseline quality gates

- `npm test -- --reporter=dot`: pass, 13 files and 58 tests.
- `npm run lint`: fails before Ba Thanh work because untracked `light-cms/` files have two unused-variable warnings and the repository enforces zero warnings.
- `npm run typecheck`: fails before Ba Thanh work because untracked `light-cms/` files are included and lack Cloudflare runtime types plus two referenced media modules.

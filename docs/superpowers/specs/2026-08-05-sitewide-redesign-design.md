# Tùng Phát Sitewide Redesign Design

## Objective

Extend the visual direction established by homepage commit `cc33734e73e4cc351da140f0f505e16fb0898a89` to every public route without changing active slugs, deleting SEO content, inventing business claims, or weakening accessibility and performance.

## Route Inventory

The current export contains 25 route HTML documents: 24 customer-facing routes and the noindex CMS preview shell.

- Homepage: `/`
- Material catalogue: `/san-pham/`
- Root product landing pages: `/go-ghep/`, `/go-ghep-cao-su/`, `/go-ghep-tram/`, `/van-mdf/`, `/mdf-chong-am/`, `/van-go-cong-nghiep/`
- CNC services: `/gia-cong-cnc/`, `/cat-cnc-go/`, `/gia-cong-cnc-mdf/`
- Brand pages: `/san-pham/an-cuong/`, `/san-pham/thanh-thuy/`, `/san-pham/ba-thanh/`, `/san-pham/kes/`
- Catalogue pages: `/catalogue/an-cuong/`, `/catalogue/thanh-thuy/`, `/catalogue/ba-thanh/`
- Workshop/project listing: `/du-an/`
- Article listing: `/bai-viet/`
- Contact and branches: `/lien-he/`
- Direct-contact legacy route: `/bao-gia/` (noindex)
- Legal: `/chinh-sach-bao-mat/`, `/dieu-khoan-su-dung/`
- System: `/cms-preview/` (noindex), 404 output

All three article files and the single project file are drafts, so no article or project detail route is currently public. Their shared renderers will still be migrated so future published content inherits the same system.

## Visual Direction

- Solid white or warm off-white surfaces with no glassmorphism, backdrop blur, translucent header, or dark full-page hero.
- Tùng Phát green communicates authority; orange is reserved for primary conversion actions and small emphasis.
- Montserrat remains the site font to preserve the homepage identity and avoid a font-loading regression.
- Wide whitespace, restrained radii, quiet borders, and low-elevation shadows create a corporate editorial site rather than an application dashboard.
- Real material, CNC, workshop, and branch imagery is reused from existing assets. Missing brand/catalogue/project data uses honest empty states.

## Architecture

### Shared Chrome

`SiteHeader` and `SiteFooter` replace both the legacy dark components and homepage-only components. `SiteHeader` owns desktop navigation, current-route state, and a keyboard-accessible mobile drawer with a solid background, Escape handling, focus return, and body scroll lock. `SiteFooter` uses an off-white main area and only a narrow green copyright strip.

`SiteShell` composes shared chrome and optional `StickyMobileActions`. Homepage retains its content structure and requirement finder, but adopts this common shell.

### Shared Page Primitives

- `PageContainer`: one responsive container/gutter contract.
- `Breadcrumbs`: semantic navigation plus route-level breadcrumb schema supplied by pages.
- `PageHero`: compact light hero with eyebrow, H1, description, optional verified image, and CTA slots.
- `SectionHeader`: consistent eyebrow, H2, description, and alignment.
- `ButtonLink`: primary, secondary, text, and dark variants with 44px minimum targets.
- `ContactCTA`: contextual Zalo/phone conversion block.
- `StickyMobileActions`: solid mobile action bar with safe-area padding and reserved page-bottom space.
- `EmptyState`: honest unavailable/draft messaging without fake controls.
- `Card` patterns: product, brand, catalogue, branch, and article views share border/radius/shadow tokens while retaining content-specific markup.
- `ResponsiveTable`: labelled horizontal scrolling for narrow screens.

### Route Migration

- Product and service CMS renderers preserve frontmatter, body Markdown, specs, FAQ, metadata, canonical, and schema while adopting shared primitives.
- `/gia-cong-cnc/` emphasizes input, processing, output, real machine imagery, process, and file-by-Zalo CTA without unverified tolerances or timelines.
- Brand pages remove fake disabled filters and describe only known material/catalogue availability. Catalogue pages never fabricate PDFs.
- `/du-an/` becomes a verified workshop image library when no case studies are published.
- `/bai-viet/` keeps a truthful empty state while its detail renderer gains readable measure and related links for future articles.
- `/lien-he/` uses the central business/location configuration, real branch photos, lightweight directions links, and no embedded maps.
- Legal pages use a simple hero, readable content width, and shared chrome without marketing excess.

## Tokens

CSS variables define semantic colors, container width, gutters, section spacing, type scale, radii, borders, shadows, focus ring, button height, control height, motion duration, and easing. Tailwind brand aliases remain for compatibility, but new shared components consume semantic classes/variables and eliminate one-off near-duplicate greens/oranges.

## SEO And Data Safety

- Keep trailing slashes, canonical URLs, active slugs, redirects, H1s, heading hierarchy, Markdown body content, specifications, FAQ, alt text, and schema.
- Add missing self-canonical metadata to brand, catalogue, and legal routes.
- Include the four public brand routes and three public catalogue routes in the sitemap; keep `/bao-gia/`, `/cms-preview/`, drafts, sentinel routes, and 404 out.
- Do not add price, stock, delivery time, official-distributor claims, customer names, project claims, technical tolerances, or catalogue files not present in data.

## Accessibility And Interaction

- One H1 per route, visible `focus-visible`, semantic navigation and tables, minimum 44px touch targets, descriptive image alt text, and no color-only state.
- Mobile navigation traps focus, closes on Escape/route selection, returns focus to its trigger, and exposes `aria-expanded`/`aria-controls`.
- Reduced motion disables non-essential transforms/transitions.
- Sticky actions reserve layout space and use safe-area padding.

## Performance

- Prefer server components; only navigation and existing interactive widgets remain client components.
- Reuse `next/image`, meaningful `sizes`, fixed aspect ratios, and lazy loading below the fold.
- No new carousel, map iframe, PDF embed, animation library usage, or dependency.
- Homepage hero remains the sole high-priority image.

## Verification

- Test-first Playwright assertions cover shared chrome, solid backgrounds, no blur, mobile navigation, breadcrumbs, H1/canonical correctness, overflow, images, console errors, sticky actions, links, and Axe serious/critical violations.
- Run lint, root typecheck, Vitest, production build, link validation, sitemap validation, Playwright, responsive screenshots, Axe, and Lighthouse for the required representative routes.

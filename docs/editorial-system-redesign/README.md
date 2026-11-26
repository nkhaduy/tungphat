# Tùng Phát editorial system redesign

## Architecture discovered

- Public editorial routes are `/bai-viet/` and `/bai-viet/[slug]/`. Article categories are taxonomy fields on article records, not separate routes. `knowledge.json` and `llms.txt` are machine-readable indexes rather than page templates.
- All article detail pages use `ArticleLanding`; CMS preview also renders that shared template and remains noindex. The published frontend is statically rendered from build-time content.
- Payload is the default content source and publishing workflow. The WordPress REST adapter is an explicit `BLOG_CONTENT_PROVIDER=wordpress` opt-in; its migration and publishing/preview parity are still incomplete. No CMS data or publishing state was changed.
- The live Payload snapshot available to the build contains three published articles: CNC file preparation, glued wood, and MDF comparison. These include a technical diagram, tables, featured media, FAQs, and actual related-content relationships. No short news article was available to test.
- Existing `ContentEntry<ArticleFrontmatter>` data, original routes, body, excerpt, taxonomy, metadata, FAQ content, and media remain the rendering contract. Existing editorial body transforms remain; only an artificial `2026-11-13` modified-date floor was removed so displayed/schema update dates use the source CMS date.

## Implementation

- Added shared editorial header, metadata, dynamic TOC, related-content panel, and listing card components under `components/editorial/`.
- Article pages now use the same compact title-first layout, with the existing featured image and body content in a readable reading column. Responsive tables, authored images, captions, lists, quotes, and links share editorial typography. CMS HTML remains sanitized and server-rendered.
- H2/H3 headings from Markdown and sanitized WordPress HTML produce stable Vietnamese-friendly anchors, including duplicate headings. Body H1 headings are demoted below the page H1. Desktop TOC is sticky within the article section; mobile uses a keyboard-accessible native disclosure. TOC active state is progressively enhanced with `IntersectionObserver`.
- Related links resolve existing article/product/service records from source taxonomy relationships. Missing, self, and duplicate targets are omitted. Listing categories are derived only from published articles; no public routes were added.
- Existing metadata, canonical handling, Open Graph fields, article and breadcrumb JSON-LD, sitemap behavior, and draft filtering were preserved. Visible FAQs remain; automatic `FAQPage` JSON-LD was removed.
- No article summary, author, category, relationship, or modification date was generated. CMS update dates identical to publication dates are suppressed in the display.

## Visual evidence

Before and after PNGs are in the local worktree's ignored `output/playwright/` directory. They were captured from the baseline and final built static site at desktop and mobile widths. The after screenshots show the compact header, real breadcrumb, source dates, full-width reading column, contextual TOC/related links, and category-based article rows. Existing Tùng Phát navigation, logo, fonts, and brand colors are retained.

The screenshots are local review artifacts and are not part of the Git commit:

- Before: `output/playwright/baseline-article-desktop.png`, `baseline-article-mobile.png`, `baseline-listing-desktop.png`, `baseline-listing-mobile.png`.
- After: `output/playwright/editorial-redesign-article-desktop.png`, `editorial-redesign-article-mobile.png`, `editorial-redesign-listing-desktop.png`, `editorial-redesign-listing-mobile.png`.
- Live baseline screenshots: `output/playwright/production-cnc-article-desktop.png`, `production-cnc-article-mobile.png`, `production-listing-desktop.png`, `production-listing-mobile.png`.
- Layout refinement: `editorial-refinement-before-{320,390,768,1280,1440,1536}.png`, `editorial-refinement-after-{320,390,768,1280,1440,1536}.png`, and full-page `editorial-refinement-after-{390,1440}-full.png`.

### Shared desktop grid refinement

- Before at 1440px, the H1 began at x=100px while the image/body began at x=172px (72px misalignment); the reading column was 768px wide and metadata stretched across 1240px.
- The article header and body now use the same 1200px outer grid. At 1280/1440/1536px, the reading column is 820px, the TOC sidebar is 280px, and the column gap is 38–40px. H1, excerpt, metadata, image, and body share one left edge at each tested width.
- Paragraphs and lists stay within a 72ch measure. The metadata-to-feature-image gap fell from 77px to 53px at 1440px; featured media and article content are unchanged.
- At 768/390/320px the layout remains one column with the native TOC disclosure. All six widths have no page-level horizontal overflow. The TOC remains sticky at 96px below the site header on desktop and stops within the article section.

## Verification

- `npm run verify` passed after the final implementation change: lint, frontend and edge type checks, 851 root tests, 313 supplier tests, 38 Payload CMS integration tests, CMS build plus Wrangler production dry run, 3,602-page static frontend export, SEO/schema/sitemap audits, media checks, and internal link validation.
- Built-site Playwright suite passed for all three sitemap article routes, `/bai-viet/`, and `/cms-preview/`. It checks unique H1s and metadata/schema, sitemap/canonical/indexability, TOC targets and keyboard use, reduced motion, sticky sidebar containment, mobile table scrolling, preview noindex, console/hydration errors, and horizontal overflow at 320, 390, 768, 1280, 1440, and 1536 CSS pixels. The layout-refinement test checks shared header/body alignment at all six sizes and desktop column dimensions at 1280/1440/1536px.
- Full-page axe WCAG 2.2 A/AA scans returned zero violations on the CNC article and listing pages.
- Chromium lab run against the final static build: 390px mobile LCP 1.156s (paragraph), CLS 0, 58ms total long tasks; 1440px desktop LCP 2.256s (featured image), CLS 0.00053, 60ms total long tasks. Both ran with 4× CPU throttling, 150ms latency, 1.6Mbps down / 750kbps up. Local TTFB was 1–2ms and the desktop LCP image transferred 119,152 bytes. These are single local lab samples, not field/Core Web Vitals data or a before/after performance claim.
- The article route adds a 1.6 kB route chunk in the build report; total first-load JavaScript remains 128 kB for article routes (103 kB shared). The project JavaScript budget passed.
- The source CMS has no short-news article and WordPress is not the active provider in this build, so those content variants were not available for live CMS-route testing. WordPress sanitization/rendering is covered by unit tests and remains opt-in.
- Three verified existing CMS photographs use committed local WebP derivatives for article feature images and listing thumbnails; unknown/new media still falls back to its configured source URL. The original CMS records and source images were not changed.

## SEO, domain, and release boundaries

- This branch does not change article slugs, route inventory, canonical configuration, robots policy, sitemap generation, DNS, redirects, Vercel, Cloudflare, D1, R2, or CMS data.
- The inspected live `gotungphat.com` route and local build have different configured host contexts (`gotungphat.com` live versus `mdftungphat.com` in repository SEO configuration). This existing domain-migration discrepancy remains outside this visual task; reconcile deployment environment and migration branches before release.
- The current default source branch contains the Payload/CMS integration changes needed by this template. The branch `codex/gotungphat-release` and ongoing catalogue/SEO work are separate worktrees. No changed editorial source files overlap their current uncommitted edits. The generated `data/imports/ba-thanh/validation-report.json` is modified in other worktrees but is not part of this branch's editorial diff; the local verification-generated timestamp was restored.
- The baseline local repository has unrelated uncommitted and untracked work. This implementation is isolated in `/Users/khaduy/.codex/worktrees/editorial-system-redesign/tungphat`; the canonical worktree was not edited.

## Handoff

- Branch: `feat/editorial-system-redesign`.
- Base: `ed8860d71c9fb1c9b45a52b36bae7a196cf3a657` on `codex/cloudflare-exit` (the CMS-aware working branch). It is ahead of `origin/codex/cloudflare-exit` by one pre-existing commit at branch creation and differs from `origin/main`; this branch has not been pushed.
- No merge, rebase, push, deploy, production write, or worktree deletion was performed.
- Safe integration: choose the release/integration branch that contains the approved Payload/CMS and domain-migration state; compare its current history with this base; then merge or cherry-pick the editorial commit into a temporary integration branch and resolve shared layout/SEO changes there. Run `npm run verify` and production route checks on that candidate before release. Do not force-push or merge directly into a protected branch.
- Rollback: revert the single editorial feature commit. No CMS records or production infrastructure need restoration.

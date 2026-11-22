# Editorial Reading System Redesign Implementation Plan

> **For agentic workers:** Execute the tasks in order. Each test is written and run before its production implementation.

**Goal:** Give all existing and future Tùng Phát articles one readable, crawlable, responsive editorial system while preserving their content, routes, CMS contracts, and SEO data.

**Architecture:** Keep `/bai-viet/`, `/bai-viet/[slug]`, and CMS preview as server-rendered entry points. Compose a shared compact article header, article body, generated TOC, contextual related links, and card presentation from existing `ContentEntry<ArticleFrontmatter>` data. Parse headings separately for Markdown and sanitized WordPress HTML, assign stable IDs, and enhance TOC active state with a small client component.

**Tech Stack:** Next.js 15 App Router, React Server Components, Tailwind CSS, React Markdown, Payload content adapter, opt-in WordPress adapter, Vitest, Playwright.

**Spec:** User request in this task; repository constraints in `AGENTS.md`.

## Global constraints

- Keep article URLs and listing routes unchanged; do not add category routes.
- Keep Payload as the default source and WordPress as an explicit opt-in provider.
- Preserve article bodies, excerpts, titles, categories, tags, metadata, dates, author, media, FAQs, preview workflow, draft filtering, and existing related relationships.
- Do not publish generated summaries or invent article metadata, categories, authors, or related links.
- Keep canonical/domain migration configuration and infrastructure out of scope.
- Use existing Montserrat fonts, Tùng Phát green/orange identity, and site shell.
- Keep article content server-rendered; add no component library or animation dependency.

---

### Task 1: Lock the editorial rendering contract with failing tests

**Files:**
- Create: `tests/editorial-article.test.ts`
- Modify: `tests/wordpress-renderer.test.ts`
- Create: `tests/editorial-listing.test.ts`

- [x] Build a valid article fixture with two identical Vietnamese H2 headings, one H3, a body table, a featured image, and one FAQ.
- [x] Assert the rendered article has one H1, matching TOC fragment links, unique H2/H3 IDs, original body/table/media, and no `FAQPage` JSON-LD.
- [x] Assert sanitized WordPress H2/H3 content receives the same stable heading anchors and keeps its safe table and images.
- [x] Mock the article collection for the listing test and assert category navigation points to rendered category sections without adding routes.
- [x] Run only these new tests and confirm failures identify the missing editorial behavior.

### Task 2: Add deterministic heading extraction and anchor generation

**Files:**
- Create: `lib/editorial/headings.ts`
- Modify: `lib/wordpress/sanitize.ts`
- Modify: `components/content/WordPressArticleBody.tsx`
- Modify: `components/content/MarkdownContent.tsx`

**Interfaces:**
- `extractMarkdownHeadings(markdown: string): EditorialHeading[]`
- `addHtmlHeadingAnchors(html: string): { html: string; headings: EditorialHeading[] }`
- `EditorialHeading = { id: string; text: string; level: 2 | 3 }`

- [x] Extract only H2/H3 headings, skipping fenced code blocks and inline Markdown syntax.
- [x] Normalize Vietnamese characters and repeated headings into stable, unique IDs.
- [x] Assign generated IDs to sanitized WordPress H2/H3 elements without allowing input IDs or unsafe attributes.
- [x] Render Markdown headings with the same precomputed IDs; keep the complete article HTML server-rendered.
- [x] Run the heading and WordPress renderer tests and confirm they pass.

### Task 3: Compose the reusable article detail layout

**Files:**
- Create: `components/editorial/ArticleHeader.tsx`
- Create: `components/editorial/ArticleTableOfContents.tsx`
- Create: `components/editorial/ArticleRelatedContent.tsx`
- Create: `components/editorial/EditorialArticleCard.tsx`
- Modify: `components/content/ArticleLanding.tsx`
- Modify: `components/content/FaqList.tsx`
- Modify: `app/bai-viet/[slug]/page.tsx`
- Modify: `app/globals.css`

- [x] Replace the image-overlay article hero with a compact breadcrumb, existing category, title, excerpt, author, publication date, and genuinely distinct update date.
- [x] Move the existing featured photograph and any current authored editorial media into the reading column with reserved aspect ratio and responsive sizing.
- [x] Keep Markdown, sanitized WordPress HTML, FAQ content, article schema, breadcrumb schema, metadata, and page rendering server-side.
- [x] Render the mobile TOC as a native closed disclosure; render the desktop TOC as a bounded sticky sidebar that stops with the article section.
- [x] Use published CMS relationships for a short related-content list; omit missing or invalid targets.
- [x] Keep the existing end-of-article contact action once and preserve its current copy.
- [x] Remove automatic `FAQPage` structured data while keeping visible FAQs.
- [x] Run the article rendering and WordPress tests.

### Task 4: Align the existing article listing with the detail system

**Files:**
- Modify: `app/bai-viet/page.tsx`
- Modify: `components/editorial/EditorialArticleCard.tsx`
- Modify: `app/globals.css`

- [x] Replace the duplicated large hero/section headings with a compact page heading and factual intro.
- [x] Build category navigation and category sections only from categories present in the fetched published articles.
- [x] Use text-forward article rows with real thumbnails, category, publication metadata, title, excerpt, and crawlable route links.
- [x] Preserve current listing metadata, JSON-LD, indexability behavior, ordering, and empty state.
- [x] Run the article listing test and inspect desktop/mobile screenshots.

### Task 5: Verify SEO, content integrity, responsive behavior, and performance

**Files:**
- Create: `e2e/editorial-experience.spec.ts`
- Create: `docs/editorial-system-redesign/README.md`
- Evidence: `output/playwright/`

- [x] Test all three published article routes, the listing route, and available CMS preview rendering.
- [x] Check heading navigation, keyboard access, mobile disclosure, sticky sidebar containment, responsive tables/images, and no horizontal overflow at 320, 390, 768, 1280, and 1440 CSS pixels.
- [x] Check rendered title, description, canonical, Open Graph image, Article schema, BreadcrumbList, publication/update dates, indexability, and sitemap inclusion.
- [x] Run axe on representative listing and detail pages; record console and hydration errors separately from the production baseline.
- [x] Capture comparable before/after desktop and mobile screenshots and a lab performance report; do not infer field Core Web Vitals from local results.
- [x] Run final `npm run verify`, inspect the final diff, and document checks, limitations, branch ancestry, and safe integration order.

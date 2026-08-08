# Tùng Phát SEO / GEO audit handoff

## Executive result

**GEO/SEO FOUNDATION: PASS**

The repository build and deterministic static SEO gates pass. Production deployment, Google Search Console/Bing verification and off-site corroboration remain owner-controlled actions and were not performed.

## Baseline → after

| Metric | Before | After |
| --- | ---: | ---: |
| Indexable URLs | 16 | 14 |
| Invalid canonicals | 0 | 0 |
| Duplicate titles | 0 | 0 |
| Broken links | 0 | 0 |
| Schema errors | 0 | 0 |
| Orphan pages | 2 | 0 |
| Thin indexable pages | 2 | 0 |
| Sitemap errors | 0 | 0 |
| AI crawler blockers | 0 | 0 |
| Pages with structured data | 16 | 14 |
| Pages with direct-answer blocks | 0 | 11 |

The lower indexable/page-schema count is intentional: empty article/project listings and unverified catalogue/brand placeholders remain noindex or excluded from the sitemap. The after values come from `npm run audit:seo` against the final `out` export.

## Implemented

- Added canonical `WebPage`/`CollectionPage` relationships, stable entity IDs and trailing-slash schema URLs; corrected guide pages that emitted `Product`.
- Added visible factual direct-answer blocks to the homepage, material/CNC hubs, published product/guide pages and published CNC service pages.
- Added `knowledge.json` from published content/business settings, excluding drafts/noindex/private embed fields.
- Added experimental `llms.txt` with canonical retrieval resources and scope notes.
- Added IndexNow key preparation, sitemap hash/change suppression, dry-run submission tooling and safe ignored key/state files.
- Added static SEO-output auditing for indexability, canonicals, duplicates, links, schema JSON parsing, sitemap errors, orphan/thin pages and answer blocks.
- Added security headers and image caching defaults in `vercel.json`; removed nonstandard `Host:` from `robots.ts`.
- Added conditional noindex handling for empty article/project listings and normalized contact/legal/quote schemas.
- Added `data/ai-search-query-set.json` with 100 prioritized queries: 20 commercial, 20 informational, 15 comparison, 15 product/use-case, 10 local, 10 CNC and 10 brand/material.

## AI search readiness

| Surface | Readiness | Evidence |
| --- | ---: | --- |
| Google Search | 84/100 | Crawlable static HTML, self-canonicals, valid sitemap, complete core metadata and entity schema. |
| Google AI Mode / Overviews | 74/100 | Nine visible answer blocks, FAQ/schema relationships and factual limitations; source citations and richer verified specs remain gaps. |
| ChatGPT Search | 70/100 | Public HTML, stable knowledge resource, llms support file and no crawler blockers; no citation guarantee or external corroboration. |
| Bing / Copilot | 72/100 | Public retrieval paths, sitemap and IndexNow tooling; Bing Webmaster verification still external. |
| Perplexity-style retrieval | 69/100 | Direct answers, canonical machine-readable index and contextual links; original evidence depth is still limited. |

These are audit readiness scores, not ranking or citation guarantees.

## Entity model

The site now connects `Tùng Phát` / `Công ty TNHH TMDV Gỗ Tùng Phát` as the organization and local business to its verified phone, email, two Tam Bình locations, TP. Hồ Chí Minh service area, website/logo/social identity, material product entities (MDF, MDF chống ẩm, gỗ ghép, plywood and related panels), published CNC services, guides, articles and projects. `WebPage.mainEntity`, `provider`, `isPartOf`, breadcrumbs and canonical `@id` values reuse the same graph identifiers.

## Top 20 remaining opportunities

1. Publish one consented, verified CNC case study with before/after evidence.
2. Replace placeholder product specifications with verified dimensions, thicknesses and surfaces.
3. Add a named reviewer only after real credentials are verified.
4. Differentiate the `/gia-cong-cnc/` hub from its two detailed CNC pages.
5. Add primary supplier/standards citations where documentation exists.
6. Add owned product, stock, edge, surface and CNC photos.
7. Integrate authentic Google reviews with source links.
8. Complete `go-ghep-la-gi.md`.
9. Complete `mdf-thuong-va-chong-am.md`.
10. Complete `chuan-bi-file-cnc.md`.
11. Publish a verified cao su vs tràm comparison.
12. Publish an MDF/MFC/HDF/plywood comparison.
13. Publish a verified dimensions/thickness reference.
14. Build a verified CNC capability matrix.
15. Build a material selector from the same validated dataset.
16. Add real file screenshots and a preflight checklist.
17. Source FAQs from sales and Search Console evidence.
18. Add verified supplier/social entity corroboration.
19. Add verified opening hours.
20. Avoid thin location pages; create local pages only with unique proof.

## Off-site actions

See [`docs/geo-offsite-strategy.md`](docs/geo-offsite-strategy.md). Owner action is required for Google Business Profile, Bing Places/Webmaster Tools, Search Console, citations, reviews, supplier references and consented PR/case-study publication.

## Verification

- Root lint: pass; root typecheck: pass.
- Root unit tests: 23 files, 114 tests pass.
- Content validation: 12/12 entries pass.
- Production build: pass; 39 generation targets, 4 draft/sentinel routes removed.
- Static SEO audit: 25 HTML pages, 14 indexable, 0 canonical/duplicate/link/schema/sitemap errors, 11 direct-answer pages and no expected-answer omissions.
- Structured-data validator: 26 exported HTML documents, valid JSON-LD, canonical trailing-slash page URLs, required route schema types and forbidden commercial fields pass.
- Internal links: 27 HTML files, 752 links, 0 broken/redirect/missing-slash targets.
- CMS lint/typecheck/build/config: pass; CMS tests 6 files, 32 tests pass.
- Playwright static server: 23/30 pass; API cases return 404 on a static-only server by design, and the legacy homepage image checker expects a legacy `picture` contract. Targeted accessibility tests pass after contrast correction. A full Wrangler run was attempted but the local worker exited during the long suite; rerun in CI/preview for final API evidence.
- The older protected-hash checker still references removed legacy component paths; the release gate is the current `npm run validate:schema` validator plus route-specific schema tests.

## Git handoff

- Repository: `/Users/khaduy/Downloads/tungphat-seo-geo-audit-worktree`
- Branch: `codex/seo-geo-foundation-20260808`
- Worktree: isolated from the dirty source workspace
- Base commit: `a698153655667b44cdd14c831f751666c127ee0b`
- Design commit: `bc84ccfedf70436d7de4e6ae32ac371ec70ae17d`
- Final commit: recorded after verification

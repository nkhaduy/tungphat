# Wave 3 Knowledge Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Wave 3 knowledge hub and three articles so they answer buyer questions early, sound like a material/CNC workshop team, and preserve the existing production routes and SEO architecture.

**Architecture:** Keep the existing Next.js article renderer, Payload collection schema, metadata helpers, JSON-LD, FAQ rendering, sitemap, and internal-link contracts. Update the three published Payload article records through the authorized CMS workflow; update only the knowledge hub copy in `app/bai-viet/page.tsx` and the article CTA copy in `components/content/ArticleLanding.tsx` if the shared article CTA still exposes audit language.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Payload CMS, Vitest, Playwright, Vercel production deployment.

**Spec:** User-provided Wave 3 execution brief in the current conversation; repository constraints in `AGENTS.md`.

## Global Constraints

- Use `tung-phat-writing` and complete a HUMAN PASS on all four public routes.
- Use `seo` checks; preserve URLs, canonicals, schema, sitemap, indexability, related links, and the primary search intent.
- Rewrite exactly `/bai-viet/`, `/bai-viet/chuan-bi-file-cnc/`, `/bai-viet/go-ghep-la-gi/`, and `/bai-viet/mdf-thuong-va-chong-am/`.
- Do not rewrite Wave 1/Wave 2 copy, catalogue KEEP pages, redirects, or site-wide metadata.
- Do not invent price, stock, dimensions, thickness ranges, CNC file formats, machine capability, tolerance, delivery, certification, waterproofing, lifespan, or other business facts.
- Remove public implementation language such as repository, JSON, null, field, schema, CMS, admin, CTA, source-data disclaimers, and repeated verification caveats.
- Keep the existing design system and responsive layout; make no visual rebrand.
- Run `npm run verify`, `npm run lint`, `npm run build`, production audits, targeted tests, commit, push `origin/main`, deploy, and verify live at desktop and 390px.

---

### Task 1: Capture Targeted Baseline and Prepare Content

**Files:**
- Read: `app/bai-viet/page.tsx`
- Read: `components/content/ArticleLanding.tsx`
- Read: `lib/content-schema.ts`
- Read: `lib/content.ts`
- Read: `docs/SEO_KEYWORD_MAP.md`
- Read: current published Payload records for the three article slugs
- Create: `docs/superpowers/plans/2026-08-31-wave-3-knowledge-content.md`

**Interfaces:**
- Consumes: current CMS article records, related product/article slugs, material/reference data, and current renderer contracts.
- Produces: exact before counts, distinct article outlines, fact-safe replacement bodies, metadata, and FAQ decisions ready for CMS entry.

- [ ] **Step 1: Record the current article metrics**
  Count words, H2/H3 headings, `kiểm tra`, `xác nhận`, `đối chiếu`, `Tùng Phát`, `không thay thế`, implementation terms, generic SEO phrases, FAQ items, related links, and common H2/body blocks for the three current Payload records.

- [ ] **Step 2: Map verified facts and links**
  Use only the current Payload product records, `data/materials/materials.json`, `data/cnc-preflight-checklist.json`, existing service routes, and the current article metadata. Retain the three article URLs, canonical values, related product/article slugs, and the MDF moisture distinction.

- [ ] **Step 3: Draft distinct article structures**
  Use a CNC preparation checklist flow, a practical gỗ ghép selection flow, and an MDF decision flow. Remove forced `Nguồn và giới hạn dữ liệu` sections and avoid making all three articles share the same H2 sequence.

- [ ] **Step 4: Perform the first HUMAN PASS on the drafts**
  Remove heading repetition, abstract filler, unsupported claims, brand repetition, and defensive explanations. Keep direct buyer actions and the existing useful sentence about marking unresolved points as `cần trao đổi`.

### Task 2: Rewrite the Knowledge Hub and Shared Article CTA

**Files:**
- Modify: `app/bai-viet/page.tsx`
- Modify: `components/content/ArticleLanding.tsx` only if needed for article-specific CTA copy
- Test: `tests/knowledge.test.ts`

**Interfaces:**
- Consumes: existing `getArticles()` data, article slugs, `ContactCTA`, and current page metadata/schema helpers.
- Produces: customer-facing hub intro/card labels and a useful article CTA without changing route, card links, canonical generation, or JSON-LD contracts.

- [ ] **Step 1: Replace hub compliance language**
  Change the hero eyebrow/description and section description to explain what visitors can learn and what each article helps them decide. Remove publish-process, CMS, validation, and `không thay thế` wording from visible copy.

- [ ] **Step 2: Make card actions specific**
  Keep dynamic article cards and links. Use readable card excerpts and a natural action label such as `Đọc hướng dẫn` without adding keyword-stuffed anchors or changing card image behavior.

- [ ] **Step 3: Polish the shared article CTA**
  Keep CTA placement after the article. Use a practical request such as sending material, specification, quantity, image, drawing, or CNC file; preserve Zalo and phone destinations. Do not add a generic sales-page block.

- [ ] **Step 4: Run focused hub/renderer assertions**
  Run `npx vitest run tests/knowledge.test.ts` and `git diff --check` after code changes. Confirm no canonical/schema/link contract was altered.

### Task 3: Publish the Three Rewritten Payload Articles

**Files:**
- Modify: production Payload records `articles/chuan-bi-file-cnc`, `articles/go-ghep-la-gi`, and `articles/mdf-thuong-va-chong-am` through the authenticated CMS admin UI
- Preserve: each record's `slug`, featured media, author, publication state, related links, and canonical path

**Interfaces:**
- Consumes: Task 1 drafts and verified repository/CMS facts.
- Produces: published article bodies, excerpts, title/meta description where needed, and visible FAQ content that matches its FAQ schema.

- [ ] **Step 1: Update the CNC article**
  Lead with what to send: file or drawing, units, material, thickness, dimensions, quantity, geometry, holes/grooves, faces, edges, and unresolved points. Keep file-format and machine-capability claims out unless authoritative project data supports them. End with `Gửi file qua Zalo`-aligned guidance and the existing CNC links.

- [ ] **Step 2: Update the gỗ ghép article**
  Define gỗ ghép early, explain how to look at joints/surface/edges and choose by use, keep cao su and tràm links distinct, and say when a real sample/tấm or drawing matters. Avoid catalogue-status and repository explanations.

- [ ] **Step 3: Update the MDF comparison article**
  Preserve the exact practical distinction that `MDF chống ẩm không đồng nghĩa chống nước.` Give dry-room, higher-moisture, and direct-water decision guidance, then connect core/surface/edge/application to the two existing product pages.

- [ ] **Step 4: Simplify or remove redundant FAQ entries**
  Keep only distinct, buyer-plausible questions with fact-safe answers. If FAQ remains, verify visible question/answer text matches the generated `FAQPage` schema; do not add FAQ for search-feature reasons.

- [ ] **Step 5: Run a CMS read-back audit**
  Fetch the three published records from the public collection endpoint and assert the new body/title/excerpt are present, slugs/canonicals/related links are unchanged, and no forbidden implementation phrases or unsupported fact classes appear.

### Task 4: SEO, Content, and Regression Verification

**Files:**
- Read/modify only if a regression is found: `app/bai-viet/page.tsx`, `components/content/ArticleLanding.tsx`, focused tests

**Interfaces:**
- Consumes: published CMS records and the updated hub/renderer.
- Produces: fresh local build output, SEO evidence, and targeted route/content test results.

- [ ] **Step 1: Run targeted tests**
  Run the article/knowledge tests plus any route/content tests covering metadata, internal links, and FAQ consistency. Do not snapshot entire article bodies.

- [ ] **Step 2: Run the required repository gate**
  Run `npm run verify`, then `npm run lint`, then `npm run build`. Record exit status and all blocking failures.

- [ ] **Step 3: Run production audits**
  Run `npm run audit:production`, `npm run audit:media-cdn:production`, and `LEGACY_REDIRECT_CHECK_ORIGIN=https://mdftungphat.com npm run validate:legacy-redirects`. Expect canonical errors 0, broken links 0, schema errors 0, CMS media leaks 0, and 22/22 redirects.

- [ ] **Step 4: Run the SEO skill command**
  Use the repository-provided `./bin/claude-seo`/`claude-seo run` command for the appropriate targeted page/content/technical check. If runtime setup is unavailable, report that evidence separately and rely on repository SEO audits without installing packages.

- [ ] **Step 5: Complete the second HUMAN PASS**
  Read all four rendered pages, not only source/API output. Check the first paragraph, first two H2s, middle section, FAQ, ending, and CTA for AI intros, SEO-template phrasing, repeated conclusions, or explanations of missing data that should simply be omitted.

### Task 5: Commit, Push, Deploy, and Live Browser QA

**Files:**
- Read: final diff and worktree

**Interfaces:**
- Consumes: verified code and published CMS content.
- Produces: pushed `main`, READY Vercel deployment, and production QA evidence for all four Wave 3 routes.

- [ ] **Step 1: Review the final diff and worktree**
  Run `git status`, `git diff --stat`, `git diff`, and `git diff --check`. Confirm only Wave 3 code/plan/test changes are present; no secrets, screenshots, crawl reports, or unrelated route edits are included.

- [ ] **Step 2: Commit the source changes**
  After fresh verification, create a commit with message `rewrite: humanize knowledge content`.

- [ ] **Step 3: Push safely**
  Run `git push origin main`. If `origin/main` advances, fetch, inspect, rebase without force, rerun required checks, and push again.

- [ ] **Step 4: Deploy using the existing Vercel workflow**
  Deploy the linked `lmskis/tungphat` project, wait for `READY`, and record the deployment URL/status. Do not touch CMS infrastructure or run supplier/media sync commands.

- [ ] **Step 5: QA production in the browser**
  Use the connected browser if available; otherwise use the repository Playwright production fallback. Inspect all four routes at about 1440px and exactly 390px. Verify visible copy, article flow, related links, CTA targets, no console/runtime errors, no horizontal overflow, no broken images, no implementation language, and no obvious AI intro.

- [ ] **Step 6: Reconcile and report**
  Re-read the live pages after deployment, compare before/after counts and outlines, verify `origin/main` equals final `HEAD`, and return only the requested Wave 3 final report with evidence and remaining risks.

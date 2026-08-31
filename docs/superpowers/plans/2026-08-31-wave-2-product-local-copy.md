# Wave 2 Product and Local Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the 14 scoped Wave 2 pages so public copy is buyer-first, fact-safe, distinct by surface and branch, and free of implementation-language leakage while preserving routes, metadata architecture, schema, catalogue links, and production behavior.

**Architecture:** Keep the existing Next.js routes and component contracts. Replace page copy at the route/component boundaries, add small data-driven per-category and per-branch copy records where shared templates currently repeat, and retain existing source-backed counts, addresses, product metadata, and CTA destinations. Add focused copy regression tests without snapshotting complete pages.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Playwright CLI, Vercel production deployment.

**Spec:** User-provided Wave 2 execution brief in the current conversation; repository constraints in `AGENTS.md`.

## Global Constraints

- Use `tung-phat-writing` for all public Vietnamese copy and complete a page-by-page HUMAN PASS.
- Use `seo` checks and preserve URLs, canonicals, schema, sitemap, internal links, catalogue links, branch Maps links, and local intent.
- Rewrite only the 14 scoped routes/components; do not rewrite Wave 1 pages, Wave 3 articles, or catalogue KEEP pages.
- Do not invent prices, stock, dimensions, warranty, standards, machine specs, branch specialization, delivery promises, dealership status, or unsupported surface claims.
- Remove visible implementation language such as JSON/null/repository/layout-shift/source-config/schema/admin/CTA explanations.
- Keep the existing design system and responsive layout; no visual rebrand or CMS migration.
- Run `npm run verify`, `npm run lint`, `npm run build`, production audits, targeted tests, commit, push `origin/main`, deploy production, and verify `https://mdftungphat.com` at desktop and 390px.

### Task 1: Capture Wave 2 Baseline and Map Copy Surfaces

**Files:**
- Read: `app/san-pham/page.tsx`
- Read: `app/tham-chieu-vat-lieu/page.tsx`
- Read: `app/du-an/page.tsx`
- Read: `app/lien-he/page.tsx`
- Read: `app/chi-nhanh/[branch]/page.tsx`
- Read: `app/thuong-hieu/ba-thanh/page.tsx`
- Read: `components/thanh-thuy/ThanhThuyCategory.tsx`
- Read: `components/thanh-thuy/ThanhThuyProductDetail.tsx`
- Read: `lib/thanh-thuy-seo.ts`
- Read: `lib/branch-pages.ts`
- Test: `tests/wave2-copy.test.ts`

**Interfaces:**
- Produces: a route-scoped keyword/leakage baseline and a focused test target for later rewrite verification.

- [ ] **Step 1: Record targeted before counts**
Run a script over the 14 route source/component files and record counts for `kiểm tra`, `xác nhận`, `đối chiếu`, `Tùng Phát`, `website`, `repository`, `JSON`, `null`, `layout shift`, `CTA`, `đang được giới thiệu`, and `không phải tuyên bố`, plus exact repeated sentences in the six main surface copy blocks and branch configs.

- [ ] **Step 2: Add failing focused assertions**
Create `tests/wave2-copy.test.ts` with assertions that the target source strings no longer contain implementation leakage after the rewrite, surface category copy has distinct descriptions/guidance, branch intros differ, and the LP detail metadata title contains only one brand suffix.

- [ ] **Step 3: Run the focused test before implementation**
Run `npx vitest run tests/wave2-copy.test.ts`.
Expected: FAIL because the current target copy contains known leakage and repeated surface/branch text.

### Task 2: Rewrite Product Hub, Material Reference, Project, Contact, and Ba Thanh Copy

**Files:**
- Modify: `app/san-pham/page.tsx`
- Modify: `app/tham-chieu-vat-lieu/page.tsx`
- Modify: `components/materials/MaterialReferenceTable.tsx`
- Modify: `components/materials/MaterialSelector.tsx`
- Modify: `app/du-an/page.tsx`
- Modify: `app/lien-he/page.tsx`
- Modify: `app/thuong-hieu/ba-thanh/page.tsx`

**Interfaces:**
- Consumes: Existing dataset, product, branch, brand, and catalogue link APIs.
- Produces: Public-facing copy for the five hub/reference/proof/contact/brand routes with unchanged route/schema/component contracts.

- [ ] **Step 1: Rewrite product hub language**
Replace compliance-style hero, answer block, comparison labels, brand intro, card CTA, and final CTA with material-first guidance: choose cốt/bề mặt, send size/thickness/quantity, open catalogue or Zalo. Keep dynamic product records and all internal links.

- [ ] **Step 2: Rewrite reference page language**
Explain how to use the table before requesting a quote, label unknown values as information to ask for, and keep the source links/data downloads useful. Replace public methodology prose about JSON/null/schema with a short buyer note about sample, code, cốt, size, thickness, and stock changing by line.

- [ ] **Step 3: Rewrite reference table and selector labels**
Remove source-tier/record-type/implementation wording from visible labels where it does not help a buyer. Preserve filtering, links, source URLs, accessibility labels, and recommendation behavior.

- [ ] **Step 4: Rewrite project/proof page**
Describe the visible workshop, CNC reference image, branch frontage, and only the work that can be seen or is source-backed. Remove grid/layout-shift/case-study defensive language from customer-facing sections.

- [ ] **Step 5: Rewrite contact page**
Make the page lead with phone/Zalo, email, two addresses, Maps, and what to send: code, material, size, thickness, quantity, or file. Remove the shared configuration/source explanation and avoid duplicating a generic CTA explanation.

- [ ] **Step 6: Rewrite Ba Thanh brand page**
Keep the brand relationship cautious in one concise location, clarify the catalogue-to-code-to-quote path, replace index/internal labels with customer labels, and use specific CTAs such as `Mở bảng mã Melamine`, `Gửi mã qua Zalo`, and `Xem địa chỉ`.

- [ ] **Step 7: Run the focused test and inspect the diff**
Run `npx vitest run tests/wave2-copy.test.ts` and `git diff --check`.
Expected: leakage and hub/reference/project/contact/brand assertions pass; surface/branch assertions remain pending until Task 3.

### Task 3: De-duplicate Surface Categories and Detail Metadata

**Files:**
- Modify: `lib/thanh-thuy-seo.ts`
- Modify: `components/thanh-thuy/ThanhThuyCategory.tsx`
- Modify: `components/thanh-thuy/ThanhThuyProductDetail.tsx`
- Modify: `tests/wave2-copy.test.ts`
- Test: `tests/thanh-thuy-seo.test.ts`
- Test: `tests/thanh-thuy-routes.test.ts`

**Interfaces:**
- Consumes: `ThanhThuyCategory`, `ThanhThuyProduct`, existing product counts, series, patterns, applications, dimensions, and source names.
- Produces: category-specific copy for Acrylic, Laminate, PVC Film, Melamine, Veneer, and Chỉ nẹp nhựa; distinct detail metadata and concise status/source notes without changing category/product URLs.

- [ ] **Step 1: Define verified buyer questions**
Use the repo facts to set one primary question per category: category role, visible/recorded series or pattern groups, application context, and what code/size/file to send. Avoid claims about durability, water resistance, heat resistance, origin, or supplier relationship.

- [ ] **Step 2: Replace repeated category copy**
Add category-specific descriptions, application explanations, and selection guidance. Remove the repeated sentence `Tư vấn nền ván, màu cạnh và quy cách cắt theo hạng mục thực tế.` and make CTA labels/destinations explicit while retaining catalogue and CNC paths.

- [ ] **Step 3: Polish surface metadata**
Make each category title/description readable, keep one brand mention, preserve local intent only where useful, and avoid a shared closing sentence across all surface pages.

- [ ] **Step 4: Polish LP 101/104G detail**
Preserve code, category, series, source dimensions, application records, image, related items, and product schema. Replace boilerplate descriptions/status/source notes with specific code-first selection guidance and explicit actions; do not add unsupported laminate performance claims.

- [ ] **Step 5: Finish the focused tests**
Add assertions for category-specific strings, no repeated full sentence across the six category copy records, one brand mention in the detail title, and preserved code/path/CTA behavior.
Run `npx vitest run tests/wave2-copy.test.ts tests/thanh-thuy-seo.test.ts tests/thanh-thuy-routes.test.ts`.
Expected: PASS.

### Task 4: De-duplicate Branch Pages Without Inventing Operations

**Files:**
- Modify: `lib/branch-pages.ts`
- Modify: `app/chi-nhanh/[branch]/page.tsx`
- Modify: `components/contact/BranchLocation.tsx` only if shared card copy requires it
- Modify: `tests/branch-pages.test.ts`
- Modify: `tests/wave2-copy.test.ts`

**Interfaces:**
- Consumes: Existing two branch addresses, image data, phone, Zalo, Maps URLs, and shared material/CNC links.
- Produces: Separate branch intros, direction/context wording, CTA ordering or related-link ordering, while keeping both Tam Bình addresses and the same actual contact facts.

- [ ] **Step 1: Add branch-specific copy fields**
Extend the branch config with prose that differs by address/context only, such as how to use the exact house number in Maps and what to send before travelling. Do not add specialization, inventory, speed, or operational differences.

- [ ] **Step 2: Render branch-specific wording**
Use config-driven sections/CTA order so 14 Tam Bình and 81B Tam Bình no longer mirror one another while retaining Thủ Đức, TP.HCM, phone/Zalo, Google Maps, and material/CNC links.

- [ ] **Step 3: Verify branch content difference**
Run `npx vitest run tests/branch-pages.test.ts tests/wave2-copy.test.ts` and compare normalized visible prose similarity before/after with a deterministic script.
Expected: both branch routes retain address/Maps/CTA facts and have materially different prose.

### Task 5: Run Full Verification and SEO Checks

**Files:**
- Read/modify only if a regression is found: relevant route/component/test files.

**Interfaces:**
- Consumes: Completed Wave 2 implementation.
- Produces: Fresh local verification evidence and no untracked secret/artifact files.

- [ ] **Step 1: Run repository verification**
Run `npm run verify`.
Expected: PASS with no canonical, broken-link, schema, or content failures.

- [ ] **Step 2: Run lint and build**
Run `npm run lint` and `npm run build`.
Expected: both exit 0.

- [ ] **Step 3: Run production audits**
Run `npm run audit:production`, `npm run audit:media-cdn:production`, and `LEGACY_REDIRECT_CHECK_ORIGIN=https://mdftungphat.com npm run validate:legacy-redirects`.
Expected: SEO/media audits pass and redirects report 22/22.

- [ ] **Step 4: Run targeted route/content tests**
Run `npx vitest run tests/wave2-copy.test.ts tests/branch-pages.test.ts tests/thanh-thuy-seo.test.ts tests/thanh-thuy-routes.test.ts tests/material-reference-page.test.ts` and the relevant Playwright route suites.
Expected: all targeted assertions pass, including route rendering, titles/H1, CTA links, catalogue links, metadata, and no implementation text.

- [ ] **Step 5: Run SEO skill checks**
Use the repository-provided `claude-seo run`/ `./bin/claude-seo` command for the appropriate page/technical checks against `https://mdftungphat.com`, following the skill runtime instructions and reporting any unavailable setup separately.

### Task 6: Review, Commit, Push, Deploy, and Production QA

**Files:**
- Read: final diff and worktree only.

**Interfaces:**
- Consumes: Verified Wave 2 changes.
- Produces: Commit on `main`, pushed `origin/main`, READY Vercel deployment, and browser evidence for all 14 live routes.

- [ ] **Step 1: Review final diff**
Run `git status`, `git diff --stat`, `git diff --check`, and inspect all modified files. Confirm no Wave 3/catalogue KEEP files, screenshots, cookies, `.env`, or temporary reports are included.

- [ ] **Step 2: Commit**
Create commit `rewrite: refine product and local commercial copy` after fresh verification evidence.

- [ ] **Step 3: Push**
Run `git push origin main`; if remote advances, fetch, inspect, rebase without force, rerun relevant verification, and push again.

- [ ] **Step 4: Deploy production**
Use the existing authorized Vercel workflow for team `lmskis` and project `tungphat`, wait for READY, and record the deployment URL/status.

- [ ] **Step 5: Browser QA**
Use the Codex App/in-app browser at `https://mdftungphat.com` for all 14 routes at approximately 1440px and 390px. Read the first 2–3 sections, confirm copy is customer-facing/distinct, inspect CTA/Maps/catalogue links, check console/runtime errors and horizontal overflow, and verify no blank/broken cards.

- [ ] **Step 6: Final report**
Return only the requested `## RESULT` report structure, with fresh evidence and explicit unsupported claims removed.

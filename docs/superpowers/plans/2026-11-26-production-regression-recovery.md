# Production Regression Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore evidence-backed pre-release public content and UI on a hotfix branch while retaining PR #37 Catalogue, Editorial, security, performance, accessibility, CMS compatibility, and Worker changes.

**Architecture:** Use the archived `codex/gotungphat-release` tree at `d4e5d1e` plus its ignored static `out/` and the approved product-system evidence as the production-before proxy. Make selective frontend/content changes on `hotfix/restore-production-regressions`, based on merge SHA `74a9f8958a9fde5edd90674deeb94592452d930f`; do not rewrite or mutate existing worktrees. Keep current Payload content loading and current Worker configuration.

**Tech Stack:** Next.js, TypeScript, Vitest, Playwright CLI, Wrangler Workers Static Assets.

**Spec:** User request in this Codex conversation; production-before evidence at `/Users/khaduy/tungphat/docs/product-system/` and archived worktree `/Users/khaduy/.codex/worktrees/gotungphat-redirect/tungphat`.

## Global Constraints

- Never deploy a production hotfix before the owner verifies and approves all restored content.
- Never reset, clean, delete, or overwrite existing branches, worktrees, stashes, or local evidence.
- Preserve the 2,910-code Catalogue, sticky filters, infinite scroll, static pagination, three supplier logos, Editorial layout and TOC, Payload compatibility, `gotungphat.com` SEO domain, frontend security patches, image optimization, accessibility, and current Cloudflare Worker configuration.
- Do not fabricate page copy or product order; use the pre-release source and approved 10-product record.
- Run `npm run verify` before a staging deployment and inspect the live staging candidate after deployment.

---

### Task 1: Preserve provenance and route comparison

**Files:**
- Create: `docs/production-regression-recovery/incident-report.md`
- Create: `docs/production-regression-recovery/evidence/`
- Inspect only: release branch/worktrees, Git reflog and stashes, PR #35/#36/#37, Worker versions, old `out/` artifact, current production routes.

- [ ] Record source-commit correlation with confidence and Cloudflare provenance limitation.
- [ ] Compare representative routes from every requested route family and both locale paths.
- [ ] Record changed and unchanged titles, H1s, descriptions, imagery, routes, navigation, business facts, CTA destinations, canonical and schema signals.
- [ ] Create desktop/mobile screenshots for the approved baseline proxy and the regressed production state.

### Task 2: Add failing restoration assertions first

**Files:**
- Create: `tests/production-home-regression.test.ts`
- Test: `tests/production-home-regression.test.ts`

- [ ] Assert the exact approved 10-item label/URL order from `docs/product-system/report.md`.
- [ ] Assert the exact pre-release homepage H1 by rendering `HomeHero`.
- [ ] Run the focused Vitest test and confirm it fails on the current merged branch for those missing behaviors.

### Task 3: Restore the approved homepage and navigation

**Files:**
- Modify: `lib/product-taxonomy.ts`
- Create/restore: `lib/homepage-copy.ts`
- Modify: `components/home/HomeContent.tsx`
- Modify: `components/home/HomeHero.tsx`
- Modify: `app/page.tsx`
- Modify: `components/site/SiteHeader.tsx`
- Modify: `components/site/MobileNavigation.tsx`
- Modify: `components/site/SiteFooter.tsx`
- Restore: approved product images and image index needed by the 10 cards.

- [ ] Restore exact labels, order, image choices, descriptions, and destinations from the approved registry.
- [ ] Restore exact pre-release hero H1 and metadata description; retain current responsive hero assets and Zalo tracking.
- [ ] Restore prior homepage sections and supplier/review/business details only where the old artifact proves a difference.
- [ ] Run the focused red/green regression test.

### Task 4: Restore non-Catalogue/non-Editorial page content

**Files:**
- Modify: `app/san-pham/page.tsx`
- Modify: `components/content/ProductLanding.tsx` and product-detail presentation as needed.
- Modify: `app/gia-cong-cnc/page.tsx`, `app/[slug]/page.tsx`, and CNC copy components as needed.
- Add/modify only evidence-backed copy and route compatibility.

- [ ] Restore approved product index headings, curated imagery, and the pre-release material editorial presentation while preserving existing published/draft visibility and Payload data flow.
- [ ] Restore exact pre-release CNC title, description, sections, internal links, and Zalo destination.
- [ ] Preserve Catalogue and Editorial files/routes unchanged unless a directly tested compatibility fix is necessary.
- [ ] Run focused tests, lint, and typecheck after each restoration slice.

### Task 5: Add release evidence and anti-regression coverage

**Files:**
- Create: `docs/production-regression-recovery/release-manifest.json`
- Create: `tests/production-home-regression.test.ts` (extend only after red/green)
- Create: `e2e/production-regression.spec.ts` if the existing Playwright setup supports it without changing test architecture.

- [ ] Record source branch, source SHA, hotfix SHA, build configuration, content snapshot checksum, build artifact checksum, and staging Worker version.
- [ ] Cover homepage H1/metadata, all ten visible cards in order, current Catalogue count/features, Editorial TOC, and Zalo CTA target.
- [ ] Keep source provenance and uncertainty explicit; do not represent an inferred SHA as metadata-confirmed.

### Task 6: Verify and stage the review candidate

**Files:**
- Create: `docs/production-regression-recovery/evidence/` screenshots and verification output.

- [ ] Run `npm run verify` on the hotfix branch and inspect complete command output.
- [ ] Capture before/after comparison screenshots at desktop and mobile widths and check image/media requests, SEO metadata, canonical and structured data.
- [ ] Deploy only to the configured isolated staging Worker after verification; record its URL and Worker version in the manifest.
- [ ] Verify staging responses and noindex behavior; do not deploy or roll back production.

### Task 7: Hallmark and web-quality pass

- [ ] Run Hallmark audit against the restored existing UI; correct only meaningful regressions against the approved reference.
- [ ] Run focused Web Quality checks across restored routes and representative Catalogue/Editorial routes.
- [ ] Update the incident report with exact evidence, verification results, remaining artifact-provenance limits, and owner-review status.

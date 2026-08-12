# Material Color Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the catalogue hub's decorative hero with the supplied, unedited material-board photograph while preserving catalogue search behavior and production performance.

**Architecture:** Keep `app/catalogue/page.tsx` as the route owner. Render the supplied WebP through `next/image` as a high-priority fill image inside a fixed-height responsive hero, place semantic HTML copy over a left-localized gradient, and keep the existing search component immediately below the hero.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, WebP, Vitest, Playwright, Vercel.

## Global Constraints

- Use the exact supplied PNG pixels as the source; do not crop, retouch, recolor, blur, regenerate, or place text inside the image file.
- Preserve the exact eyebrow, heading, and description copy.
- Preserve the catalogue search and filter behavior.
- Keep the hero image eager/high-priority for LCP and prevent CLS with a sized hero container.
- Verify the deployed result at `https://mdftungphat.com/ma-mau/` on desktop and at 390x844.

---

### Task 1: Lock the hero contract

**Files:**
- Modify: `tests/catalogue-hub-layout.test.ts`

**Interfaces:**
- Consumes: static markup from `SupplierCataloguePage()`.
- Produces: regression assertions for the semantic hero copy, supplied WebP, image preload priority, and unchanged single search interface.

- [ ] Add a failing test that expects `material-color-hero.webp`, the image description, high fetch priority, and the exact existing copy.
- [ ] Run `npm test -- tests/catalogue-hub-layout.test.ts` and confirm the new assertion fails because the image is not yet implemented.

### Task 2: Add the optimized source asset and hero composition

**Files:**
- Create: `public/images/material-color-hero.webp`
- Modify: `app/catalogue/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `/images/material-color-hero.webp` at the source resolution of 1916x821.
- Produces: an LCP-prioritized responsive hero with localized overlays and breakpoint-specific image positioning.

- [ ] Convert the supplied PNG to WebP at the original resolution with high-quality photographic settings.
- [ ] Replace the decorative panel illustration with `next/image`, a semantic text layer, subtle left gradient, vignette, and responsive fixed heights between 430px and 520px.
- [ ] Keep breadcrumb above the image and keep `SupplierCatalogSearch` in normal document flow with balanced spacing.
- [ ] Run `npm test -- tests/catalogue-hub-layout.test.ts` and confirm the focused test passes.

### Task 3: Verify and deploy

**Files:**
- Verify only: application source, generated static output, production deployment.

**Interfaces:**
- Consumes: the completed hero source and asset.
- Produces: committed, deployed, directly verified production output.

- [ ] Run focused tests, typecheck, full tests, lint, and `npm run build`.
- [ ] Serve the production export and inspect desktop, laptop, tablet, and 390x844 mobile layouts, search interaction, console errors, failed requests, overflow, and CLS-sensitive dimensions.
- [ ] Commit only the hero source, asset, regression test, and this plan; push `main` and wait for the Vercel production deployment to become READY.
- [ ] Verify `https://mdftungphat.com/ma-mau/` directly on desktop and mobile, including the WebP response and search/filter behavior.

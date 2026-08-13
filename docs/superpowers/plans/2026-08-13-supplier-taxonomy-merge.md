# Supplier Taxonomy Merge Implementation Plan

**Goal:** Expose all imported supplier records, including Thanh Thuỳ edge-band families, through a shared canonical taxonomy with nested material groups.

**Architecture:** Keep public color-code indexes and supplier-page counts stable, while the shared catalogue adds unique non-code family records. Normalize supplier labels into a separate canonical pattern field and retain source collection labels for display.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-13-supplier-taxonomy-merge-design.md`

## Implementation

- [x] Add canonical pattern types, classification, and supplier/material-scoped counts.
- [x] Generate canonical fields and merge unique non-code families into the shared catalogue.
- [x] Preserve verified color-code indexes, supplier totals, routes, and sitemap behavior.
- [x] Add independent material and `pattern` URL filters with legacy subgroup compatibility.
- [x] Add a second-level `Kiểu vân / màu` control after material selection.
- [x] Add Thanh Thuỳ edge-family and Melamine subgroup browser regressions.
- [x] Run lint, typecheck, unit tests, build validations, link checks, and relevant E2E tests.

## Delivery

- [ ] Commit and push the intended files.
- [ ] Wait for deployment readiness.
- [ ] Verify desktop and mobile production behavior, console errors, and failed requests.

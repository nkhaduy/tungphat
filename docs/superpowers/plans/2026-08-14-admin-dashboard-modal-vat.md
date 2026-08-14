# Admin Dashboard Polish and VAT Rate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Simplify the Admin payment dashboard, open quote details in an in-page modal, remove obsolete navigation copy, and make VAT an optional 0/8/10 percent input without changing existing quotes.

**Architecture:** Keep the existing payment queue API and mutation flow. Add an additive nullable `vat_rate` column and compute VAT on the server from the pre-tax base; retain legacy `vat_amount` when an old quote has no stored rate. Extract a read-only quick-view modal component that the dashboard opens after fetching `/api/quotes/:id`.

**Tech Stack:** React 19, TypeScript, Hono/Cloudflare Workers, D1 SQLite migrations, Vitest, Vite/Pages.

---

### Task 1: Add VAT-rate domain calculation and validation

**Files:**
- Modify: `quote-app/src/shared/types.ts`
- Modify: `quote-app/src/shared/calculations.ts`
- Modify: `quote-app/src/worker/schemas.ts`
- Test: `quote-app/tests/calculations.test.ts`

- [ ] **Step 1: Write failing tests** for blank/legacy VAT preservation, 8%, 10%, rounding, and rejection of any rate other than `0`, `8`, or `10`.
- [ ] **Step 2: Run `npm test -- tests/calculations.test.ts`** and confirm the new tests fail because rate-aware calculation is absent.
- [ ] **Step 3: Add `vatRate?: 0 | 8 | 10 | null` to quote input/record types, validate the optional nullable rate in `quoteInputSchema`, and add a calculation helper that uses `round(base * rate / 100)` while preserving a legacy `vatAmount` only when the rate is `null`.
- [ ] **Step 4: Update `calculateTotals` to use `subtotal - discount + shippingFee + processingFee` as the VAT base and return the computed `vatAmount`.
- [ ] **Step 5: Run the focused calculation tests, then the full calculation suite, and confirm all pass.**
- [ ] **Step 6: Commit with `feat: calculate VAT from explicit rate`.**

### Task 2: Persist VAT rate additively and return it from quote APIs

**Files:**
- Create: `quote-app/migrations/0007_quote_vat_rate.sql`
- Modify: `quote-app/src/worker/quotes.ts`
- Modify: `quote-app/src/worker/pdf.ts`
- Test: `quote-app/tests/migration.test.ts`
- Test: `quote-app/tests/payment-api.test.ts`

- [ ] **Step 1: Add a migration test** asserting `ALTER TABLE quotes ADD COLUMN vat_rate`, an allowed-value check, and no destructive SQL.
- [ ] **Step 2: Run the migration test and confirm it fails before the migration exists.**
- [ ] **Step 3: Add nullable `vat_rate` with a `0/8/10` check; do not backfill or update existing quote rows.
- [ ] **Step 4: Include `vat_rate` in `QuoteRow`, `mapQuote`, create/update INSERT/UPDATE statements, and pass it to `calculateTotals`; reject tampered monetary VAT by recomputing on the Worker.
- [ ] **Step 5: Make PDF labels include `(8%)` or `(10%)` when a stored rate exists, while retaining the existing zero/legacy rendering.
- [ ] **Step 6: Run migration/API/PDF tests and commit with `feat: persist quote VAT rates safely`.**

### Task 3: Convert employee VAT input to a percentage field

**Files:**
- Modify: `quote-app/src/client/pages/QuoteEditorPage.tsx`
- Modify: `quote-app/src/client/pages/QuotePreviewPage.tsx`
- Modify: `quote-app/src/client/styles.css`
- Test: `quote-app/tests/calculations.test.ts`

- [ ] **Step 1: Add a focused test covering the form calculation contract: empty input means 0% for new quotes and 8/10 produce the expected amount.**
- [ ] **Step 2: Run the focused test and verify it fails before the form state has `vatRate`.**
- [ ] **Step 3: Replace the VAT money input with `Thuế VAT (%)`, keep the field visually blank for 0/null, accept only `8` and `10`, and show an inline validation message for other values.
- [ ] **Step 4: Include `vatRate` in new/edit payloads; preserve a legacy stored `vatAmount` when an old quote has `vatRate = null` and the user has not changed the field.
- [ ] **Step 5: Display the selected rate in preview and keep all totals derived from the shared calculation helper.
- [ ] **Step 6: Run calculation and typecheck checks and commit with `feat: use percentage VAT in quote editor`.**

### Task 4: Simplify dashboard and add read-only quick-view modal

**Files:**
- Create: `quote-app/src/client/components/QuoteQuickViewModal.tsx`
- Modify: `quote-app/src/client/pages/AdminDashboardPage.tsx`
- Modify: `quote-app/src/client/styles.css`
- Test: `quote-app/tests/admin-dashboard-ui.test.tsx`

- [ ] **Step 1: Add a presentational component test** that renders a selected quote and asserts customer name, payment totals, item rows, and a close button are present.
- [ ] **Step 2: Run the focused UI test and confirm it fails because the modal component does not exist.**
- [ ] **Step 3: Implement the modal with loading/error/quote states, `role="dialog"`, `aria-modal`, `Escape` handling, backdrop close, body-scroll lock, and focus return.
- [ ] **Step 4: Remove the dashboard metrics request and all old metric/detail/shortcut sections; set the page title to `Cần xử lý` with no description.
- [ ] **Step 5: Make customer name the prominent queue-card heading, reduce quote-number typography, and change `Xem đơn` from a link to a button that fetches and opens the modal without navigation.
- [ ] **Step 6: Increase dashboard type/spacing/button sizes and verify the mobile breakpoint remains usable.
- [ ] **Step 7: Run the focused UI test and full test suite, then commit with `feat: polish admin payment dashboard`.**

### Task 5: Remove obsolete navigation and list copy

**Files:**
- Modify: `quote-app/src/client/components/AppShell.tsx`
- Modify: `quote-app/src/client/pages/QuoteListPage.tsx`
- Test: `quote-app/tests/admin-dashboard-ui.test.tsx`

- [ ] **Step 1: Add assertions that Admin navigation does not include `Lịch sử` and Admin quote-list header has no obsolete filter description.
- [ ] **Step 2: Run the focused test and confirm it fails against the current navigation/copy.**
- [ ] **Step 3: Remove only the sidebar/dashboard links; keep the route, audit API, and audit data intact.
- [ ] **Step 4: Make the Admin list `PageHeader` omit `description` while keeping the employee description unchanged.
- [ ] **Step 5: Run the focused UI test and commit with `chore: remove obsolete admin navigation copy`.**

### Task 6: Full verification, production migration, and deployment

**Files:**
- Modify only generated build artifacts as produced by existing scripts; do not hand-edit production data.

- [ ] **Step 1: Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run build:pages` from `quote-app`.
- [ ] **Step 2: Run Wrangler worker/pages dry-runs and inspect the diff/status for unrelated changes.
- [ ] **Step 3: Export a fresh remote D1 backup to `quote-app/artifacts/payment-rollout/` before applying migration `0007`.
- [ ] **Step 4: Record counts for `quotes`, `quote_items`, `quote_versions`, and `audit_logs`; apply only `0007_quote_vat_rate.sql`; re-check counts and verify no rows were deleted.
- [ ] **Step 5: Deploy Pages using the existing production project workflow and verify `/api/health`, `/login`, security headers, and the latest production deployment hash.
- [ ] **Step 6: Use the authenticated browser session if available to verify Admin desktop and 390px mobile; inspect console errors and failed requests. If no session exists, report that authenticated verification remains blocked without requesting credentials.
- [ ] **Step 7: Run `git status --short --branch` and record the backup path/checksum, migration counts, test/build output, deployment URL, and any browser limitation.

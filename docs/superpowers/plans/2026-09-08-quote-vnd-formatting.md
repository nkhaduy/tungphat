# Quote VND Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every user-visible money value in `quote-app` uses Vietnamese thousands separators while stored/API values remain integer VND, then deploy and verify the production quote app.

**Architecture:** Keep one shared formatter/parser pair in `src/shared/calculations.ts`. Editable controls render grouped input text but emit integer VND; read-only client surfaces and the PDF renderer consume the shared display formatter. Regression coverage will exercise the shared utility plus representative editor, grid, payment, preview, and PDF output contracts.

**Tech Stack:** TypeScript, React 19, Vitest, Vite, pdf-lib, Cloudflare Pages, Wrangler, Playwright CLI.

**Spec:** User request in this session: production Vietnamese VND formatting audit and deployment for `quote-app`.

## Global Constraints

- Use `.` as the Vietnamese thousands separator; never show comma-grouped money.
- Persist and send integer VND values; never persist formatted strings.
- Do not format quantities, dates, phone numbers, quote numbers, versions, file sizes, or bank account numbers.
- Preserve existing quote calculations, autosave, keyboard navigation, paste behavior, PDF layout, and production data.
- Do not expose or commit secrets; do not run destructive production data operations.
- Run `npm ci`, `npm run cf:typegen`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build:pages` from `quote-app` before deployment.
- Deploy Cloudflare Pages project `tungphat-quotes` and QA `https://baogia.mdftungphat.com`, not localhost.

---

### Task 1: Shared money parsing and formatting

**Files:**
- Modify: `quote-app/src/shared/calculations.ts`
- Test: `quote-app/tests/calculations.test.ts`

**Interfaces:**
- Produces `parseVndInput(value: string): number` for editable money controls.
- Produces `formatVndInput(value: number): string` for grouped input text.
- Produces `formatVnd(value: number): string` for read-only currency display.

- [ ] **Step 1: Write failing tests** for zero, one, sub-thousand, and multi-thousand values plus pasted `1.250.000`, `1250000`, `1,250,000`, and `1 250 000`.
- [ ] **Step 2: Run the focused calculation tests** and confirm the new parser/format contract fails before implementation.
- [ ] **Step 3: Implement the shared parser and keep numeric integer invariants.** Reject or clamp unsafe values consistently with existing validation.
- [ ] **Step 4: Run the focused tests** and confirm they pass.

### Task 2: Replace duplicated money presentation paths

**Files:**
- Modify: `quote-app/src/client/components/QuoteGrid.tsx`
- Modify: `quote-app/src/client/components/PaymentActions.tsx`
- Modify: `quote-app/src/client/pages/QuoteEditorPage.tsx`
- Modify: `quote-app/src/client/pages/QuotePreviewPage.tsx`
- Modify: `quote-app/src/worker/pdf.ts`
- Test: `quote-app/tests/quote-editor-ui.test.ts`
- Test: `quote-app/tests/payment-actions.test.ts`
- Test: `quote-app/tests/pdf.test.ts`

**Interfaces:**
- All editable money fields call the shared parser and input formatter.
- All visible money cells, summaries, preview totals, and PDF rows use shared money formatters.

- [ ] **Step 1: Add failing UI/PDF assertions** for `125.000`, `203.000`, `406.000`, `1.250.000`, and preview/PDF totals.
- [ ] **Step 2: Run the focused UI/PDF tests** and confirm each missing shared-format path fails.
- [ ] **Step 3: Replace direct money `toLocaleString` calls and duplicated money parsers** without changing quantity/date/file-size formatting.
- [ ] **Step 4: Run focused tests** and confirm they pass.
- [ ] **Step 5: Run the Impeccable mechanical detector once** over changed UI targets and fix only meaningful findings within scope.

### Task 3: Full verification and Git handoff

**Files:**
- Modify: only files identified by the audit and tests.

- [ ] **Step 1: Run `npm ci` and all quote-app quality gates.**
- [ ] **Step 2: Inspect the final diff and money-format search results.**
- [ ] **Step 3: Commit the implementation and tests with a focused message.**
- [ ] **Step 4: Push `codex/quote-payment-flow` without rewriting history.**

### Task 4: Cloudflare production deployment and QA

**Files:**
- No production data files; deployment artifacts remain ignored.

- [ ] **Step 1: Check Wrangler auth without printing secrets.**
- [ ] **Step 2: Build and deploy `dist/client` to Pages project `tungphat-quotes` using the authenticated local path or configured integration.**
- [ ] **Step 3: Verify the deployment URL and production origin status/assets.**
- [ ] **Step 4: Run the repository's applicable production acceptance script if credentials are available without exposing them.**
- [ ] **Step 5: QA login, editor values, preview totals, PDF values, console, and network directly on `https://baogia.mdftungphat.com`.**
- [ ] **Step 6: Report `PASS` only with fresh verification evidence; otherwise report the exact blocker as `PARTIAL`.**

# Quote Payment Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Add explicit payment actions for employees and an Admin dashboard queue grouped by unpaid, deposited, partially paid, and fully paid quotes without deleting or overwriting existing quote data.

**Architecture:** Keep the existing quote lifecycle/status and add an additive `payment_status` column. Continue using `deposit_amount` as the persisted amount received for backward compatibility, expose it as payment received in the new UI, and enforce all transitions in the Worker API. Admin dashboard data is role-protected and grouped server-side; the client only renders and submits actions.

**Tech Stack:** React 19, Vite, Hono Worker, Cloudflare D1/SQLite migrations, Vitest, Playwright, Wrangler Pages.

---

### Task 1: Define payment domain rules first

**Files:**
- Modify: `quote-app/src/shared/types.ts`
- Modify: `quote-app/src/shared/calculations.ts`
- Test: `quote-app/tests/calculations.test.ts`

- [ ] **Step 1: Write failing domain tests**

Add tests for `PaymentStatus = UNPAID | DEPOSITED | PARTIAL | PAID`, including:

```ts
expect(derivePaymentStatus("UNPAID", 0, 1000000)).toBe("UNPAID");
expect(derivePaymentStatus("DEPOSITED", 200000, 1000000)).toBe("DEPOSITED");
expect(derivePaymentStatus("PARTIAL", 500000, 1000000)).toBe("PARTIAL");
expect(derivePaymentStatus("PAID", 1000000, 1000000)).toBe("PAID");
expect(() => normalizePayment("PARTIAL", 0, 1000000)).toThrow(/lớn hơn 0/);
expect(() => normalizePayment("PAID", 999999, 1000000)).toThrow(/đủ/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/calculations.test.ts`

Expected: FAIL because the payment types/helpers do not exist yet.

- [ ] **Step 3: Implement the smallest domain API**

Add `PaymentStatus`, `paymentStatus` to `QuoteRecord`, and pure helpers:

```ts
export type PaymentStatus = "UNPAID" | "DEPOSITED" | "PARTIAL" | "PAID";

export function normalizePayment(status: PaymentStatus, received: number, grandTotal: number) {
  assertVnd(received, "Số tiền đã nhận");
  if (received > grandTotal) throw new Error("Số tiền đã nhận không thể lớn hơn tổng thanh toán.");
  if (status === "UNPAID" && received !== 0) throw new Error("Đơn chưa thanh toán phải có số tiền bằng 0.");
  if ((status === "DEPOSITED" || status === "PARTIAL") && (received <= 0 || received >= grandTotal)) {
    throw new Error("Thanh toán một phần phải lớn hơn 0 và nhỏ hơn tổng thanh toán.");
  }
  if (status === "PAID" && (grandTotal <= 0 || received !== grandTotal)) throw new Error("Đã thanh toán phải đủ tổng thanh toán.");
  return { received, remainingAmount: grandTotal - received };
}
```

Keep `deriveQuoteStatus` working for legacy lifecycle/PDF behavior and use payment helpers only for payment fields.

- [ ] **Step 4: Run focused tests and all existing tests**

Run: `npm test -- --run tests/calculations.test.ts` then `npm test`.

Expected: new payment tests and the existing 42 tests pass.

- [ ] **Step 5: Commit**

```bash
git add quote-app/src/shared/types.ts quote-app/src/shared/calculations.ts quote-app/tests/calculations.test.ts
git commit -m "feat: define quote payment states"
```

### Task 2: Add an additive, data-preserving D1 migration

**Files:**
- Create: `quote-app/migrations/0006_quote_payment_status.sql`
- Modify: `quote-app/src/worker/quotes.ts`
- Modify: `quote-app/src/worker/schemas.ts`
- Test: `quote-app/tests/migration.test.ts` or a new `quote-app/tests/payment-api.test.ts`

- [ ] **Step 1: Write migration/API contract tests**

Cover the backfill and constraints:

```ts
expect(backfillPaymentStatus({ status: "PAID", deposit_amount: 10, grand_total: 10 })).toBe("PAID");
expect(backfillPaymentStatus({ status: "DEPOSITED", deposit_amount: 5, grand_total: 10 })).toBe("DEPOSITED");
expect(backfillPaymentStatus({ status: "ISSUED", deposit_amount: 0, grand_total: 10 })).toBe("UNPAID");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/payment-api.test.ts`

Expected: FAIL because migration/backfill helpers are absent.

- [ ] **Step 3: Create the additive migration**

Use only `ALTER TABLE`, indexes, and one deterministic backfill; do not drop/rebuild tables:

```sql
ALTER TABLE quotes ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'UNPAID'
  CHECK (payment_status IN ('UNPAID','DEPOSITED','PARTIAL','PAID'));
UPDATE quotes SET payment_status = CASE
  WHEN status='PAID' THEN 'PAID'
  WHEN status='DEPOSITED' AND deposit_amount > 0 AND deposit_amount < grand_total THEN 'DEPOSITED'
  WHEN deposit_amount >= grand_total AND grand_total > 0 THEN 'PAID'
  ELSE 'UNPAID'
END WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_payment_status_date ON quotes(payment_status, quote_date DESC);
```

The migration never deletes rows or quote items. Before remote execution, take a D1 backup and verify row counts/checksums.

- [ ] **Step 4: Extend schemas and quote mapping**

Accept `paymentStatus` and `depositAmount` in the request, validate with `normalizePayment`, select/map `payment_status`, and include it in audit snapshots. Keep lifecycle `status` updates compatible: paid maps to `PAID`, deposited/partial map to `DEPOSITED`, and unpaid remains the derived draft/issued state.

- [ ] **Step 5: Add a protected payment mutation endpoint**

Implement `POST /api/quotes/:id/payment` for Admin and the owning Employee. Request body:

```ts
{ paymentStatus: PaymentStatus; receivedAmount: number; version: number }
```

Load the quote, reject cancelled/deleted records, validate the version and normalized amount, update only payment fields plus compatible lifecycle status, increment `version`, and write one `QUOTE_PAYMENT_UPDATED` audit record in the same D1 batch.

- [ ] **Step 6: Run migration/API tests and commit**

Run: `npm test -- --run tests/payment-api.test.ts tests/migration.test.ts`.

Expected: all focused tests pass.

```bash
git add quote-app/migrations/0006_quote_payment_status.sql quote-app/src/worker/quotes.ts quote-app/src/worker/schemas.ts quote-app/tests/payment-api.test.ts quote-app/tests/migration.test.ts
git commit -m "feat: persist quote payment status safely"
```

### Task 3: Add Admin dashboard queue API

**Files:**
- Modify: `quote-app/src/worker/admin.ts`
- Modify: `quote-app/src/worker/index.ts`
- Modify: `quote-app/src/shared/types.ts`
- Test: `quote-app/tests/payment-api.test.ts`

- [ ] **Step 1: Write failing authorization and grouping tests**

Assert Admin can receive four groups, Employee receives 403, cancelled/deleted rows are excluded, and a paid quote is not in the three actionable groups.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/payment-api.test.ts`.

Expected: FAIL because `/api/admin/payment-queue` is not routed.

- [ ] **Step 3: Implement server-side grouping**

Add `paymentQueueHandler` with one bounded query returning the newest 200 non-deleted quotes and grouping records by `payment_status` into `unpaid`, `deposited`, `partial`, and `paid`. Use the existing `quoteSelect`/`mapQuote` path so totals and employee contact fields stay consistent.

- [ ] **Step 4: Route and verify**

Register `GET /api/admin/payment-queue` after `requireAdmin`. Run focused tests and `npm test`.

- [ ] **Step 5: Commit**

```bash
git add quote-app/src/worker/admin.ts quote-app/src/worker/index.ts quote-app/src/shared/types.ts quote-app/tests/payment-api.test.ts
git commit -m "feat: expose admin payment queue"
```

### Task 4: Add employee payment controls

**Files:**
- Modify: `quote-app/src/client/pages/QuoteEditorPage.tsx`
- Create: `quote-app/src/client/components/PaymentActions.tsx`
- Modify: `quote-app/src/client/styles.css`
- Test: `quote-app/tests/payment-actions.test.ts` (pure action/validation tests)

- [ ] **Step 1: Write failing action tests**

Test that `Đã thanh toán` returns the grand total, `Đã cọc` rejects zero, and `Thanh toán một phần` accepts only an integer strictly between zero and the total.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/payment-actions.test.ts`.

- [ ] **Step 3: Implement controls and modal**

Add a focused component that receives `grandTotal`, current `paymentStatus`, `receivedAmount`, and `onChange`. Render three buttons with accessible labels, an amount input for deposit/partial, and an inline validation message. The editor includes `paymentStatus` in its form/payload and keeps autosave/version handling unchanged.

- [ ] **Step 4: Wire save and verify**

Ensure a new employee quote can be saved as PAID without manually typing the grand total. Run focused tests, `npm run typecheck`, and `npm test`.

- [ ] **Step 5: Commit**

```bash
git add quote-app/src/client/pages/QuoteEditorPage.tsx quote-app/src/client/components/PaymentActions.tsx quote-app/src/client/styles.css quote-app/tests/payment-actions.test.ts
git commit -m "feat: let employees choose payment status"
```

### Task 5: Build the Admin dashboard landing queue

**Files:**
- Modify: `quote-app/src/client/pages/AdminDashboardPage.tsx`
- Modify: `quote-app/src/client/components/StatusBadge.tsx`
- Modify: `quote-app/src/client/styles.css`
- Test: `quote-app/tests/payment-actions.test.ts`

- [ ] **Step 1: Write failing rendering/state tests**

Cover the four headings (`Cần xử lý`, `Đã cọc`, `Thanh toán một phần`, `Đã thanh toán`), a `Xem đơn` link per record, and moving a row after a successful payment mutation.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/payment-actions.test.ts`.

- [ ] **Step 3: Implement the dashboard**

Load `/api/admin/payment-queue` on mount. Render four responsive sections/cards; each row links to `/admin/bao-gia/:id`. Action buttons call `POST /api/quotes/:id/payment`, update local grouped state from the response, and show an error without discarding the current queue on failure. The paid group keeps `Xem đơn` only.

- [ ] **Step 4: Verify desktop/mobile semantics**

Run unit tests, `npm run lint`, and `npm run typecheck`; use Playwright against local Pages preview at 1440px and 390px to confirm no console errors, visible group labels, and working `Xem đơn` links.

- [ ] **Step 5: Commit**

```bash
git add quote-app/src/client/pages/AdminDashboardPage.tsx quote-app/src/client/components/StatusBadge.tsx quote-app/src/client/styles.css quote-app/tests/payment-actions.test.ts
git commit -m "feat: add admin payment queue dashboard"
```

### Task 6: Update lists and PDF payment presentation

**Files:**
- Modify: `quote-app/src/client/pages/QuoteListPage.tsx`
- Modify: `quote-app/src/client/pages/QuotePreviewPage.tsx`
- Modify: `quote-app/src/worker/pdf.ts`
- Modify: `quote-app/src/client/components/StatusBadge.tsx`
- Test: `quote-app/tests/pdf.test.ts`, `quote-app/tests/payment-actions.test.ts`

- [ ] **Step 1: Write failing display tests**

Assert new paid snapshots show no QR and “ĐÃ THANH TOÁN ĐỦ”, partial/deposit snapshots show remaining amount, and list filters use `paymentStatus` labels.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/pdf.test.ts tests/payment-actions.test.ts`.

- [ ] **Step 3: Implement presentation changes**

Use `paymentStatus` for badges, filters, preview copy, and QR visibility. Preserve the stored snapshot schema/version behavior so existing PDFs remain downloadable and unchanged.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- --run tests/pdf.test.ts tests/payment-actions.test.ts` and `npm run build`.

```bash
git add quote-app/src/client/pages/QuoteListPage.tsx quote-app/src/client/pages/QuotePreviewPage.tsx quote-app/src/worker/pdf.ts quote-app/src/client/components/StatusBadge.tsx quote-app/tests/pdf.test.ts quote-app/tests/payment-actions.test.ts
git commit -m "feat: show payment state in lists and PDFs"
```

### Task 7: Full quality gate and safe production rollout

**Files:**
- Modify: `quote-app/scripts/production-feature-acceptance.mjs`
- Create: `quote-app/scripts/payment-acceptance.mjs`
- Create: `quote-app/artifacts/payment-rollout/` (generated, ignored)

- [ ] **Step 1: Add non-destructive acceptance flow**

Use a temporary employee and temporary quotes with unique customer names. Exercise unpaid, deposited, partial, and paid creation; verify Admin queue groups and `Xem đơn`; update one quote through each Admin action; assert audit rows. Clean up only temporary records using existing soft-delete APIs and verify their quote items/PDF versions remain.

- [ ] **Step 2: Run the complete local quality gate**

Run from `quote-app`:

```bash
npm run lint
npm run typecheck
npm test
npm run build:pages
npx wrangler deploy src/worker/index.ts --dry-run --config wrangler.worker.jsonc
```

Expected: exit code 0 for every command and no new lint/type/test failures.

- [ ] **Step 3: Back up production before migration**

Run `npm run d1:backup` and record the generated backup path/checksum. Query production counts for `quotes`, `quote_items`, and `quote_versions`; do not proceed if counts change before migration.

- [ ] **Step 4: Apply the additive migration remotely**

Run `npm run d1:migrate:remote`, then query the same counts and validate payment-status distribution plus `remaining_amount >= 0`. The migration must report no deleted rows.

- [ ] **Step 5: Deploy Pages and verify readiness**

Run `npm run deploy:pages`, wait for the deployment URL to respond, then open `https://baogia.mdftungphat.com` in an authenticated browser context. Verify Admin desktop/mobile dashboard, employee payment controls, production API responses, console errors, failed network requests, and that a paid test quote is absent from “Cần xử lý”. Use only temporary test records and soft-delete them afterward.

- [ ] **Step 6: Commit rollout artifacts and report evidence**

Commit only source/tests/docs and safe audit reports, never credentials, cookies, or production secrets. Report backup path, migration result, test/build output, deployment URL, and desktop/mobile verification evidence.


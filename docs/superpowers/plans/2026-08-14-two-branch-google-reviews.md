# Two-Branch Google Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an equal-weight, two-branch Google review section using only live Google Business Profile API data, real reviewer photos when available, content-first ordering, accessible opposing review rails, and verified production deployment.

**Architecture:** Migrate the CMS GBP connection model from one fixed row to one OAuth credential with multiple selected locations, then return branch-isolated payloads from the public reviews endpoint. Refactor the frontend into data utilities and focused React components; desktop duplicates review cards only for a hidden seamless marquee while mobile and reduced-motion users receive manual horizontal scrolling.

**Tech Stack:** Cloudflare Pages Functions, D1/SQLite migrations, TypeScript, React 19, Next.js 15 static export, Tailwind CSS, Vitest, Playwright, Vercel Git deployment, Cloudflare Wrangler.

---

## File Structure

- Create `cloudflare-cms/migrations/0008_gbp_multi_location.sql`: remove the single-row constraint and persist a stable display order and branch key per GBP location.
- Modify `cloudflare-cms/src/gbp/oauth.ts`: return every verified Tùng Phát location instead of one selected location.
- Modify `cloudflare-cms/src/gbp/handler.ts`: save all eligible locations and emit branch-isolated public/admin payloads.
- Modify `cloudflare-cms/src/gbp/sync.ts`: refresh shared credentials once and synchronize each configured location independently.
- Modify `cloudflare-cms/src/gbp/storage.ts`: query and order written reviews before rating-only reviews.
- Modify `cloudflare-cms/tests/gbp.test.ts`: cover multi-location selection, storage, synchronization boundaries, public payloads, and ordering.
- Create `components/reviews/google-review-types.ts`: frontend payload and review contracts.
- Create `components/reviews/google-review-utils.ts`: validation, sorting, date formatting, initials, and branch-link fallback helpers.
- Create `components/reviews/ReviewCard.tsx`: reviewer identity/photo fallback, rating, expandable content, owner reply, and Google footer.
- Create `components/reviews/RatingSummary.tsx`: equal-sized branch summary and Google CTA.
- Create `components/reviews/BranchReviewRow.tsx`: desktop direction, pause behavior, accessible duplication, and mobile scroll-snap.
- Modify `components/reviews/GoogleReviews.tsx`: fetch/cache orchestration and independent loading/empty/error states while preserving the existing hydration-safe session-cache change.
- Create `components/reviews/google-review-utils.test.ts`: ordering and fallback unit tests.
- Modify `e2e/site.spec.ts`: responsive, accessibility, motion, external-link, and API-state coverage.
- Modify `cloudflare-cms/scripts/validate-build.mjs`: require migration `0008_gbp_multi_location.sql`.
- Modify `cloudflare-cms/scripts/validate-cloudflare-config.mjs`: include migration 0008 in the production migration sequence.

### Task 1: Multi-Location Database Contract

**Files:**
- Create: `cloudflare-cms/migrations/0008_gbp_multi_location.sql`
- Modify: `cloudflare-cms/scripts/validate-build.mjs`
- Modify: `cloudflare-cms/scripts/validate-cloudflare-config.mjs`
- Test: `cloudflare-cms/tests/gbp.test.ts`

- [ ] **Step 1: Write a failing migration-contract test**

Add a test that reads migration 0008 and asserts it rebuilds `gbp_connection` without `CHECK (id = 1)`, preserves the existing row, and adds unique `location_name`, `branch_key`, and `display_order` fields.

```ts
it("supports multiple GBP locations with stable public order", () => {
  const sql = readFileSync(new URL("../migrations/0008_gbp_multi_location.sql", import.meta.url), "utf8");
  expect(sql).not.toContain("CHECK (id = 1)");
  expect(sql).toContain("location_name TEXT UNIQUE");
  expect(sql).toContain("branch_key TEXT NOT NULL");
  expect(sql).toContain("display_order INTEGER NOT NULL");
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts`

Expected: FAIL because migration 0008 does not exist.

- [ ] **Step 3: Implement the forward-only migration**

Create a transaction that renames the old table, creates the multi-row table, copies row `id=1` as `branch_key='tp1'` and `display_order=1`, drops the old table, and recreates indexes. Do not delete reviews or encrypted tokens.

- [ ] **Step 4: Update configuration validators**

Require `migrations/0008_gbp_multi_location.sql` in the build input list and append `0008_gbp_multi_location.sql` to the exact production migration order.

- [ ] **Step 5: Run migration and validator tests**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts && npm run validate:cloudflare-config`

Expected: PASS.

- [ ] **Step 6: Commit the database contract**

```bash
git add cloudflare-cms/migrations/0008_gbp_multi_location.sql cloudflare-cms/scripts/validate-build.mjs cloudflare-cms/scripts/validate-cloudflare-config.mjs cloudflare-cms/tests/gbp.test.ts
git commit -m "feat: support multiple GBP locations"
```

### Task 2: Discover And Persist Both Tùng Phát Locations

**Files:**
- Modify: `cloudflare-cms/src/gbp/oauth.ts`
- Modify: `cloudflare-cms/src/gbp/handler.ts`
- Test: `cloudflare-cms/tests/gbp.test.ts`

- [ ] **Step 1: Write failing location-selection tests**

Cover two valid Tùng Phát locations, unrelated locations, duplicate place IDs, deterministic TP1/TP2 ordering, and the TP2 public fallback URL.

```ts
expect(selectTungPhatLocations(locations).map((item) => item.branchKey)).toEqual(["tp1", "tp2"]);
expect(selectTungPhatLocations(locations)[1].fallbackMapsUrl).toBe("https://share.google/sv4nkFEznsGsWhRAQ");
```

- [ ] **Step 2: Run tests and confirm the missing selector failure**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts`

Expected: FAIL because `selectTungPhatLocations` is undefined.

- [ ] **Step 3: Implement deterministic multi-location selection**

Return all matching website/title locations, deduplicate by place ID/location name, assign TP1/TP2 using the repository's verified branch/place evidence, and reject unrelated profiles. Keep the current single-location helper only if another caller still uses it.

- [ ] **Step 4: Persist every selected location in OAuth callback**

Encrypt the access and refresh token once per selected connection row, upsert by `location_name`, set `branch_key`/`display_order`, retain an existing refresh token when Google omits a new one, and mark connections not rediscovered in this OAuth run as disconnected rather than deleting them.

- [ ] **Step 5: Run focused CMS tests**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts`

Expected: PASS for two-location discovery and persistence.

- [ ] **Step 6: Commit OAuth multi-location support**

```bash
git add cloudflare-cms/src/gbp/oauth.ts cloudflare-cms/src/gbp/handler.ts cloudflare-cms/tests/gbp.test.ts
git commit -m "feat: connect both Tùng Phát profiles"
```

### Task 3: Synchronize And Serve Branch-Isolated Review Data

**Files:**
- Modify: `cloudflare-cms/src/gbp/sync.ts`
- Modify: `cloudflare-cms/src/gbp/storage.ts`
- Modify: `cloudflare-cms/src/gbp/handler.ts`
- Modify: `cloudflare-cms/public/gbp/dashboard.js`
- Test: `cloudflare-cms/tests/gbp.test.ts`

- [ ] **Step 1: Write failing synchronization and ordering tests**

Assert that one branch failure does not discard the other branch result and that SQL ordering places substantive comments first, then short comments, then rating-only rows, with timestamps as tie-breakers.

```ts
expect(publicPayload.branches.map((branch) => branch.status)).toEqual(["ready", "error"]);
expect(publicReviewOrderSql).toContain("CASE WHEN TRIM(COALESCE(comment,'')) = '' THEN 1 ELSE 0 END");
expect(publicReviewOrderSql).toContain("LENGTH(TRIM(COALESCE(comment,''))) DESC");
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts`

Expected: FAIL because sync and public payload are single-location.

- [ ] **Step 3: Refactor token refresh and per-location sync**

Refresh a usable credential row once, propagate refreshed encrypted access data to connected rows for the same authorized account, and run each location sync in an isolated `Promise.allSettled` boundary. Return `{ branches: [{ branchKey, status, reviews, metrics, keywords, syncedAt, errorCode? }] }`.

- [ ] **Step 4: Return the public multi-branch contract**

Emit ordered branches with `branchKey`, `location`, `mapsUrl`, `count`, `averageRating`, `lastSyncedAt`, `status`, and `reviews`. Include `reviewer_photo_url`. Use the supplied TP2 share URL only when the API Maps URI is missing.

- [ ] **Step 5: Update the admin dashboard data shape**

Render one summary per connection and label each review with its branch. The dashboard must never interpolate secrets or raw OAuth data into HTML.

- [ ] **Step 6: Run CMS unit and build validation**

Run: `npm --prefix cloudflare-cms test -- --run tests/gbp.test.ts && npm --prefix cloudflare-cms run build`

Expected: PASS.

- [ ] **Step 7: Commit API and synchronization changes**

```bash
git add cloudflare-cms/src/gbp/sync.ts cloudflare-cms/src/gbp/storage.ts cloudflare-cms/src/gbp/handler.ts cloudflare-cms/public/gbp/dashboard.js cloudflare-cms/tests/gbp.test.ts
git commit -m "feat: serve branch-isolated Google reviews"
```

### Task 4: Frontend Contracts And Review Utilities

**Files:**
- Create: `components/reviews/google-review-types.ts`
- Create: `components/reviews/google-review-utils.ts`
- Create: `components/reviews/google-review-utils.test.ts`

- [ ] **Step 1: Write failing utility tests**

Test safe payload parsing, content-length ordering, rating-only placement, timestamp tie-breaking, Vietnamese date labels, whitespace-only comments, initials, photo URL rejection outside HTTPS, and TP2 link fallback.

```ts
expect(sortReviews([ratingOnly, short, detailed]).map((review) => review.review_id)).toEqual(["detailed", "short", "rating-only"]);
expect(reviewerInitial("  Nguyễn Văn An ")).toBe("N");
expect(safePhotoUrl("javascript:alert(1)")).toBeNull();
```

- [ ] **Step 2: Run tests and confirm module-not-found failure**

Run: `npx vitest run components/reviews/google-review-utils.test.ts`

Expected: FAIL because the utility module does not exist.

- [ ] **Step 3: Define strict frontend types and pure helpers**

Model `Review`, `ReviewBranch`, and `ReviewPayload`; validate unknown JSON without trusting optional fields; sort without mutating API arrays; only allow HTTPS profile photos; and preserve exact review text.

- [ ] **Step 4: Run utility tests**

Run: `npx vitest run components/reviews/google-review-utils.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit frontend data contracts**

```bash
git add components/reviews/google-review-types.ts components/reviews/google-review-utils.ts components/reviews/google-review-utils.test.ts
git commit -m "test: define Google review data behavior"
```

### Task 5: Build Equal-Weight Branch Review Components

**Files:**
- Create: `components/reviews/ReviewCard.tsx`
- Create: `components/reviews/RatingSummary.tsx`
- Create: `components/reviews/BranchReviewRow.tsx`
- Modify: `components/reviews/GoogleReviews.tsx`
- Test: `e2e/site.spec.ts`

- [ ] **Step 1: Add failing browser assertions**

Mock `/api/gbp/reviews` with two branches and assert two equal branch rows, six real cards maximum per branch, real profile image use, initial fallback after image error, written-review-first order, compact rating-only cards, exact Google links, and `Xem thêm` expansion.

```ts
await expect(page.locator("[data-review-branch]")).toHaveCount(2);
await expect(page.locator("[data-review-branch='tp1'] [data-review-card]").first()).toContainText("Nội dung dài");
await expect(page.locator("[data-review-branch='tp2'] a[target='_blank']")).toHaveAttribute("href", "https://share.google/sv4nkFEznsGsWhRAQ");
```

- [ ] **Step 2: Run the focused E2E test and confirm failure**

Run: `npx playwright test e2e/site.spec.ts --grep "two-branch Google reviews" --reporter=list`

Expected: FAIL because the current section supports one branch and renders no states.

- [ ] **Step 3: Implement `ReviewCard`**

Use a native `img` for remote reviewer photos with width/height, lazy loading, referrer policy, and an `onError` fallback. Render correct filled/empty stars, natural-height text, five-line clamp, accessible expansion, optional owner reply, and subtle Google source footer. Rating-only cards must omit empty copy blocks.

- [ ] **Step 4: Implement `RatingSummary` and `BranchReviewRow`**

Give both rows the same CSS grid tracks, minimum height, summary sizing, card width, padding, and typography. Reverse only desktop column order and animation direction for TP2. Duplicate the rail visually only when enough reviews exist, mark duplicates `aria-hidden`, pause on hover/focus, and disable motion for mobile/reduced-motion.

- [ ] **Step 5: Refactor `GoogleReviews` orchestration**

Preserve the current uncommitted hydration-safe change that reads `sessionStorage` inside `useEffect`. Add skeleton, empty, and error branches; validate cached/network payloads; render each location independently; retry network data even when cache exists; and limit each branch to six ordered reviews.

- [ ] **Step 6: Run focused frontend tests**

Run: `npx vitest run components/reviews/google-review-utils.test.ts && npx playwright test e2e/site.spec.ts --grep "two-branch Google reviews" --reporter=list`

Expected: PASS.

- [ ] **Step 7: Commit the review UI**

```bash
git add components/reviews/GoogleReviews.tsx components/reviews/ReviewCard.tsx components/reviews/RatingSummary.tsx components/reviews/BranchReviewRow.tsx e2e/site.spec.ts
git commit -m "feat: redesign Google reviews for two branches"
```

### Task 6: Responsive, Accessibility, And State Regression Coverage

**Files:**
- Modify: `e2e/site.spec.ts`

- [ ] **Step 1: Add failing state and responsive tests**

Cover loading skeletons, one-ready/one-error isolation, both-empty messaging, 390px manual horizontal scrolling, desktop opposing directions, hover/focus pause, reduced-motion animation removal, keyboard expansion, no horizontal page overflow, and no duplicated accessible review content.

- [ ] **Step 2: Run the focused suite and confirm any missing behavior fails**

Run: `npx playwright test e2e/site.spec.ts --grep "Google reviews" --reporter=list`

Expected: FAIL only for uncovered behavior added in Step 1.

- [ ] **Step 3: Make minimal component/style corrections**

Adjust only the review components needed to satisfy the assertions; do not alter global styles or unrelated sections.

- [ ] **Step 4: Run review E2E at desktop and mobile projects**

Run: `npx playwright test e2e/site.spec.ts --grep "Google reviews" --reporter=list`

Expected: PASS with no accessibility or overflow failures.

- [ ] **Step 5: Commit regression coverage**

```bash
git add components/reviews e2e/site.spec.ts
git commit -m "test: cover Google review responsive states"
```

### Task 7: Full Verification, Production Migration, Deployment, And Browser Validation

**Files:**
- Modify only if verification exposes an in-scope defect.

- [ ] **Step 1: Inspect the final diff and preserve unrelated work**

Run: `git status --short && git diff --check && git diff --stat HEAD~5..HEAD`

Expected: no whitespace errors; unrelated `.DS_Store`, catalogue/report, output, payload CMS, and prior user changes remain untouched.

- [ ] **Step 2: Run the full quality gate**

Run: `npm run lint && npm run typecheck && npm test && npm --prefix cloudflare-cms test && npm run build`

Expected: every command exits 0. Fix in-scope failures and rerun the failing command plus the full gate.

- [ ] **Step 3: Run relevant Playwright regression**

Run: `npm run test:e2e -- --grep "Google reviews|homepage"`

Expected: PASS.

- [ ] **Step 4: Back up and migrate production D1**

Run the documented non-destructive backup first: `npm run d1:backup`.

Then run: `npm run d1:migrate:remote`.

Expected: migration 0008 applies successfully and the existing TP1 connection/reviews remain present.

- [ ] **Step 5: Deploy the CMS/API**

Run: `npm run cms:deploy`.

Expected: Cloudflare Pages production deployment reaches ready state at `https://cms.mdftungphat.com`.

- [ ] **Step 6: Connect/sync both locations using the existing authenticated CMS session**

Open the GBP admin view in the supported authenticated browser, complete Google OAuth only if the current token cannot enumerate both locations, trigger synchronization, and verify TP1 and TP2 appear independently. Pause only for Google 2FA/consent if required.

- [ ] **Step 7: Verify the public API without exposing secrets**

Run: `curl -fsS https://cms.mdftungphat.com/api/gbp/reviews` and summarize only branch names, statuses, counts, and whether reviewer photos/comments are present. Never print OAuth fields or credentials.

Expected: two ordered branch payloads; TP2 resolves to its canonical Maps URI or the provided share URL.

- [ ] **Step 8: Push the website commit and wait for Vercel production**

Run: `git push origin main`.

Use the repository's Vercel deployment workflow/status tooling to wait until the pushed commit is production-ready. Do not treat localhost or a preview URL as completion.

- [ ] **Step 9: Verify production desktop and mobile in a real browser**

Open `https://mdftungphat.com`, inspect the review section at desktop and mobile widths, and verify equal TP1/TP2 sizing, real reviewer photos/fallbacks, long-review-first ordering, rating-only placement, correct expansion, correct Google links, motion/reduced-motion behavior, no overflow, and readable short cards.

- [ ] **Step 10: Inspect production console and network**

Confirm no console errors and no failed requests for the review API or profile images. A blocked third-party photo must fall back to initials without breaking the card.

- [ ] **Step 11: Record final evidence**

Report deployed commit, Cloudflare deployment, Vercel production state, public branch counts/statuses, desktop/mobile verification, and any unavoidable 2FA/OAuth blocker. Declare PASS only when production is directly verified.

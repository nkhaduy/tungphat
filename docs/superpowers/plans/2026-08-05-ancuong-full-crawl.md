# An Cuong Full Crawl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete, validate, document, commit, push, and open a draft PR for the resumable 2,682-product An Cuong catalogue crawl without production mutation.

**Architecture:** Continue the existing HTTP-first TypeScript pipeline in the dedicated linked worktree. Preserve source HTML/data in resumable atomic checkpoints, derive normalized catalogue/taxonomy/relations/media artifacts deterministically, and keep large raw/runtime/media binaries out of Git while committing manifests, fixtures, tests, exports, and reports.

**Tech Stack:** Node.js 26, TypeScript, TSX, Vitest, Next.js 15, native fetch, SHA-256 media deduplication, Git/GitHub CLI.

## Global Constraints

- Work only in `/Users/khaduy/Downloads/tungphat-release-20260718-ancuong` on `codex/ancuong-catalog-crawler`.
- Use HTTP-first crawling with concurrency `2`, jitter, at most three retries, `Retry-After` compliance, and no CAPTCHA/rate-limit bypass.
- Keep at least 20% filesystem capacity and 10 GiB free after any media download estimate.
- Do not merge, deploy, mutate production, rotate proxies, or create the SEO integration branch.
- Do not commit raw cache, runtime state, large media binaries, secrets, cookies, tokens, local paths, or `.DS_Store`.
- Execute inline in this session; the user explicitly prohibited delegation to subagents for this run.

---

### Task 1: Repository Hygiene And Storage Gate

**Files:**
- Modify: `.gitignore`
- Delete from Git tracking: `.DS_Store`
- Create: `docs/catalog/ancuong/ANCUONG_STORAGE_ESTIMATE.md`

**Interfaces:**
- Consumes: Git worktree state at commit `6d158c1c566e9b2f24cd56284c3cf09e27258b11` and the seven-product sample metrics.
- Produces: a clean worktree and an evidence-based media storage decision.

- [ ] **Step 1: Stop tracking Finder metadata**

Add root and recursive ignore rules, run `git rm --cached -- .DS_Store`, verify no other file is removed, and commit only `.gitignore` plus `.DS_Store` as `chore(repo): stop tracking macOS metadata`.

- [ ] **Step 2: Measure current capacity and sample footprint**

Run `df -h .`, `du -sh data/imports/ancuong`, `du -sh data/imports/ancuong/media`, count sample references/checksum owners, and calculate low, middle, and conservative estimates without presenting linear extrapolation as certainty.

- [ ] **Step 3: Record the gate**

Write `ANCUONG_STORAGE_ESTIMATE.md` with free bytes, reserve thresholds, average sample bytes, 50% checksum duplication, estimates, and an explicit download/no-download decision.

### Task 2: Baseline And Resumability Hardening

**Files:**
- Modify if required: `scripts/ancuong/crawl-details.ts`, `scripts/ancuong/state.ts`, `scripts/ancuong/http-client.ts`, `scripts/ancuong/config.ts`
- Test if required: `tests/ancuong-catalog.test.ts`, `tests/ancuong-live.test.ts`
- Create: `data/imports/ancuong/reports/pre-full-crawl-baseline.json`

**Interfaces:**
- Consumes: `raw/listings.json`, `state/crawl-details.json`, HTTP client retry policy, and product-detail parser.
- Produces: batch-safe detail persistence where completed records survive interruption and unfinished URLs remain resumable.

- [ ] **Step 1: Run the existing baseline**

Run `npm run catalog:ancuong:sample`, `npm run catalog:ancuong:validate`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`; save command, exit status, duration, and result counts in the baseline JSON.

- [ ] **Step 2: Add failing tests for any missing safety guarantee**

If inspection or baseline proves that detail records are only written after all 2,682 requests finish, add a Vitest case that interrupts a multi-record run and asserts the prior successful detail plus atomic checkpoint remain usable. Add focused tests for terminal 404 handling or retry/block behavior only when the current implementation fails the stated rule.

- [ ] **Step 3: Implement the smallest crawler hardening**

Persist each successful parsed detail atomically in bounded batches, preserve existing detail records on resume, never mark an unparsed URL parsed, retain final evidence for non-retryable failures, and keep concurrency at the CLI-requested value `2`.

- [ ] **Step 4: Re-run the full baseline**

Repeat all six commands and replace the baseline JSON only with the successful evidence.

### Task 3: Full Detail Crawl And Parser Drift Audit

**Files:**
- Update: `data/imports/ancuong/raw/details.json`
- Update: `data/imports/ancuong/state/crawl-details.json`
- Create: `data/imports/ancuong/reports/full-detail-crawl.json`
- Create: `docs/catalog/ancuong/ANCUONG_FULL_CRAWL_REPORT.md`
- Create: `docs/catalog/ancuong/ANCUONG_PARSER_DRIFT_AUDIT.md`
- Modify/test parser fixtures only if a new layout is observed.

**Interfaces:**
- Consumes: 2,682 listing URLs and resumability guarantees from Task 2.
- Produces: one explicit terminal classification per discovered URL and a parser-layout evidence report.

- [ ] **Step 1: Crawl with conservative concurrency**

Run `npm run catalog:ancuong:crawl:details -- --resume --concurrency=2`, monitor disk, branch/HEAD, consecutive HTTP blocks, error ratio, and checkpoint progress, then resume automatically after transient interruption.

- [ ] **Step 2: Audit drift after at least 100 details**

Compute missing code/category/image/description/technical-table/relation rates and select coverage across all categories plus slash codes, special characters, multiple dimensions, same-color/application relations, and multi-image galleries.

- [ ] **Step 3: Fix any verified new layout with TDD**

Save a minimal sanitized fixture, add a failing parser regression test, implement selector/parser support, pass the focused test, and reparse affected records from cached raw input instead of refetching unaffected URLs.

- [ ] **Step 4: Close coverage accounting**

Generate counts for discovered, queued, fetched, parsed, normalized, validated, retryable failure, final failure, missing, duplicate, unavailable, terminal, and non-terminal; do not claim full completion unless terminal equals 2,682.

### Task 4: Relations, Taxonomy, Media, Validation, And Export

**Files:**
- Update: `data/imports/ancuong/normalized/*.json`
- Update: `data/imports/ancuong/export/*.json`
- Create/update: `data/imports/ancuong/reports/full-relationship-audit.json`
- Create/update: `data/imports/ancuong/reports/full-media-discovery.json`
- Update: `docs/catalog/ancuong/ANCUONG_RELATIONSHIP_AUDIT.md`
- Update: `docs/catalog/ancuong/ANCUONG_MEDIA_REPORT.md`
- Update: `docs/catalog/ancuong/ANCUONG_VALIDATION_REPORT.md`

**Interfaces:**
- Consumes: complete terminal detail dataset.
- Produces: factual relation graph, 33-category/16-facet taxonomy, complete media URL manifest, optional safely bounded binary set, and checksum-bearing export bundle.

- [ ] **Step 1: Normalize and build factual relations**

Run normalize and relation commands, count each relation type, one-way/two-way/dangling/self/duplicate/conflict/collision/outside-catalogue edges, and never promote inferred reverse edges into the public factual dataset.

- [ ] **Step 2: Validate taxonomy**

Preserve all discovered categories including zero-count records, classify navigation-only/currently-empty/listing-empty/source-inconsistent categories, and audit facet slug/case/diacritic/typo/truncation/unknown collisions.

- [ ] **Step 3: Complete media discovery before binary downloads**

Build a role-classified manifest for product media only, reject UI/tracking/challenge assets, report reference/unique/duplicate/shared/invalid/external counts, and compare estimated download bytes with the Task 1 reserve.

- [ ] **Step 4: Download only when the storage gate passes**

Run `npm run catalog:ancuong:media -- --resume --concurrency=2`, preserve source formats, validate HTTP/MIME/dimensions/decode/SHA-256, deduplicate checksum owners, and stop before the safety reserve is crossed.

- [ ] **Step 5: Validate and export**

Run normalize, validate, diff, export, and report; extend `export-manifest.json` with required full-crawl/media status and stable checksums if the existing manifest omits them, backed by focused tests.

### Task 5: Idempotency, Final Gates, Documentation, And Delivery

**Files:**
- Update: `docs/catalog/ancuong/ANCUONG_DIFF_REPORT.md`
- Update: `docs/catalog/ancuong/ANCUONG_CRAWLER_RUNBOOK.md`
- Update: `docs/catalog/ancuong/ANCUONG_FINAL_REPORT.md`
- Update all full-crawl reports and regression fixtures produced above.

**Interfaces:**
- Consumes: first complete canonical export and cache/checkpoints.
- Produces: stable second-run result, verified commits, pushed branch, and draft PR.

- [ ] **Step 1: Run cached idempotency pass**

Run the pipeline with `--resume --changed-only --concurrency=2` or equivalent component commands that avoid unchanged binary refetches, then confirm `NEW=0`, `UPDATED=0`, `UNCHANGED=2682`, `MISSING_FROM_SOURCE=0`, `RELATION_CHANGED=0`, and `MEDIA_CHANGED=0`, except for source changes supported by hashes and timestamps.

- [ ] **Step 2: Remove runtime-only canonical churn**

Inspect Git diff for timestamp/order/format/path/random-ID changes and change serialization so unchanged source input produces no canonical dataset diff.

- [ ] **Step 3: Run final verification**

Run validation, all Vitest suites, live smoke, typecheck, lint, build, secret scan, `git diff --check origin/main...HEAD`, and explicit scans for cookies/tokens/local absolute paths.

- [ ] **Step 4: Commit logical deliverables**

Commit parser/tests, full dataset/graph/media manifests, and documentation in separate coherent commits without binaries, raw caches, runtime state, secrets, or large logs.

- [ ] **Step 5: Push and create the draft PR**

Push `codex/ancuong-catalog-crawler`, create a draft PR to `main` titled `feat: add resumable An Cuong catalogue crawler`, and do not merge it.

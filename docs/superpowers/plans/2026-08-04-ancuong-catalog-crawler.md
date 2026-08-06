# An Cuong Catalogue Crawler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an idempotent, resumable HTTP-first crawler and export pipeline for An Cuong material catalogue data.

**Architecture:** Server-rendered category and detail pages feed focused TypeScript parsers. Atomic state, stable JSON, hashes, validation, diffing, and media manifests form the offline pipeline; live HTTP is isolated behind a conservative client.

**Tech Stack:** TypeScript 5.9, Node.js 20+, `tsx`, Vitest, Zod, native `fetch`, native crypto/filesystem APIs.

## Global Constraints

- Work only on `codex/ancuong-catalog-crawler`, based on `origin/main@ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`.
- Do not add public routes, SEO pages, production writes, deployment changes, or Thanh Thuy pipeline coupling.
- Use HTTP first; no CAPTCHA bypass, proxy rotation, cookie persistence, or browser profile storage.
- Keep large raw/cache/state/media directories out of Git; commit fixtures, manifests, schemas, reports, and scripts.
- Use test-first implementation and stable atomic output.

---

### Task 1: Core contracts, serialization, and state

**Files:** Create `scripts/ancuong/types.ts`, `config.ts`, `stable-json.ts`, `state.ts`, and matching tests under `tests/ancuong/`.

- [ ] Write failing tests for stable JSON, atomic writes, resume states, hashes, and source-safe paths.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement types, configuration, stable sorting, atomic write, and checkpoint store.
- [ ] Run focused tests and commit.

### Task 2: HTTP and HTML discovery parsers

**Files:** Create `http-client.ts`, `html.ts`, `discover.ts`, `crawl-listings.ts`, fixtures, and tests.

- [ ] Write failing tests for retry/Retry-After, allowlist enforcement, root category discovery, listing cards, facets, and dedupe.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement the conservative HTTP client and SSR parsers.
- [ ] Run focused tests and commit.

### Task 3: Product detail, dimensions, relations, and normalization

**Files:** Create `crawl-details.ts`, `crawl-relations.ts`, `normalize.ts`, fixtures, and tests.

- [ ] Write failing tests for code normalization, detail facets, media, product-line data, dimension matrices, source notes, and explicit same-color relations.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement parsers and normalized schema mapping.
- [ ] Run focused tests and commit.

### Task 4: Media, validation, diff, and export

**Files:** Create `download-media.ts`, `validate.ts`, `diff.ts`, `export.ts`, `report.ts`, JSON Schema, tests, and ignored runtime directories.

- [ ] Write failing tests for MIME checks, checksums, duplicate media, validation errors, diff classes, stable exports, and missing-source retention.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement media manifesting, validation, diff, reports, and export manifest checksums.
- [ ] Run focused tests and commit.

### Task 5: CLI and package commands

**Files:** Create `cli.ts`; modify `package.json` and `.gitignore`.

- [ ] Write failing CLI integration tests for step routing and supported options.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement all requested commands plus `sample`, `all`, and `test:live`.
- [ ] Run focused tests and commit.

### Task 6: Live sample, discovery, idempotency, and documentation

**Files:** Create committed sample manifests/exports and all `docs/catalog/ancuong/*.md` reports.

- [ ] Run live sample and full discovery with conservative concurrency.
- [ ] Normalize, validate, diff, export, and report.
- [ ] Run a second normalize/export cycle and verify stable output plus mostly `UNCHANGED` diff.
- [ ] Document exact evidence, limits, counts, commands, and risks; commit.

### Task 7: Repository quality gates

**Files:** Only fixes required by verification.

- [ ] Run unit/integration tests, typecheck, lint, build, secret scan, sample validation, and Git status review.
- [ ] Fix only An Cuong pipeline regressions, re-run complete gates, and record evidence.
- [ ] Create final intentional commits and leave the worktree clean.

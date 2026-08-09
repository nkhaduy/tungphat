# Phase 7 Indexation And Authority Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish evidence-backed Google/Bing indexation, local entity, external authority, and real search visibility baselines without expanding the 54-URL indexable catalogue.

**Architecture:** Authenticated platform checks are attempted first through the available browser/API surfaces, with exact blockers recorded when ownership access is unavailable. Public observations are then collected into durable JSON evidence, existing entity and search-monitoring models are extended only where Phase 7 needs new states, and the existing material reference is strengthened as the primary citation asset. A final production deployment is made only if public code changes, followed by crawl, search, performance, security, and repository verification.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Playwright, Node.js CLI scripts, Vercel, public Google/Bing/Maps endpoints.

## Global Constraints

- Production acceptance URL is `https://mdftungphat.com`.
- Start from Phase 6 SHA `5cb5416715f11fb336a35ba6230813ec6b40bc88`.
- Do not audit Phase 1-6 again or add indexable pages to solve visibility.
- Preserve the exact 40-query P2-P6 methodology and run it once after the final production deployment.
- Keep 54 indexable URLs unless a genuinely unique requirement emerges; this plan adds none.
- Never infer `CONFIRMED_NOT_INDEXED` from public result absence.
- Never add unverified social, GBP, Bing Places, supplier, or manufacturer relationships to schema.
- Keep Lighthouse mobile at least 90 preferred, LCP at or below 2.8 seconds preferred, TBT below 200 ms, and CLS at 0.
- Do not expose account tokens, credentials, verification documents, or private owner data.
- Use `null` for unavailable metrics and record exact auth/owner blockers.

---

### Task 1: Authenticate Search And Local Ownership Surfaces

**Files:**
- Create: `reports/gsc-baseline.json`
- Create: `reports/phase7-auth-attempts.json`

**Interfaces:**
- Consumes: Browser availability, `~/.config/codex-seo/google-api.json`, backlink/Bing credential checks, the nine priority URLs from the Phase 7 specification.
- Produces: Machine-readable auth status, property/listing status, sitemap status, inspection outcomes, request-indexing outcomes, and genuine blockers for later reports.

- [ ] **Step 1: Check browser and API authentication without reading cookies or secret material**

Run the Browser skill bootstrap for `https://search.google.com/search-console/`, then run:

```bash
python3 /Users/khaduy/.codex/skills/seo/scripts/google_auth.py --check --json
python3 /Users/khaduy/.codex/skills/seo/scripts/backlinks_auth.py --check --json
```

Expected: either usable authenticated access or an exact `AUTH_BLOCKED` reason for GSC, GBP, Bing Webmaster, and Bing Places.

- [ ] **Step 2: Inspect GSC and Bing when authenticated**

Inspect `/`, `/san-pham/`, `/van-go-cong-nghiep/`, `/gia-cong-cnc/`, `/cat-cnc-go/`, `/tham-chieu-vat-lieu/`, `/bai-viet/mdf-thuong-va-chong-am/`, `/bai-viet/go-ghep-la-gi/`, and `/bai-viet/chuan-bi-file-cnc/`. Submit the sitemap only if absent, request indexing only for eligible non-indexed/materially updated priority URLs, and export GSC search analytics for the maximum reasonable recent period.

- [ ] **Step 3: Inspect local platform ownership when authenticated**

Search and compare both known Google place IDs, the two Tam Binh addresses, phone `0909 259 160`, domain, Bing Places, and Facebook candidates. Do not create duplicates; stop only claim actions that require verification.

- [ ] **Step 4: Persist truthful null baselines when auth is unavailable**

Write `reports/gsc-baseline.json` with `null` metrics and `reports/phase7-auth-attempts.json` with browser/API evidence and blocker codes. Do not invent query, property, listing, or indexation data.

### Task 2: Collect Public Indexation, Search, Entity, And Authority Evidence

**Files:**
- Modify: `scripts/observe-indexation.ts`
- Create: `scripts/collect-phase7-public-evidence.ts`
- Create: `tests/phase7-public-evidence.test.ts`
- Create: `reports/indexation-status.json`
- Create: `reports/phase7-public-evidence.json`
- Create: `data/local-entity-branches.json`
- Create: `data/external-authority-baseline.json`

**Interfaces:**
- Consumes: production sitemap, public Google/Bing observations, Maps place IDs, canonical first-party NAP, public brand/phone/address searches, Common Crawl results, and authenticated outputs from Task 1.
- Produces: per-URL status matrix, branch entity records, verified/unknown mentions, backlink baseline, and evidence provenance.

- [ ] **Step 1: Write failing tests for status mapping and evidence confidence**

Add Vitest cases proving that public absence maps to `NOT_OBSERVED`, auth absence maps to `AUTH_BLOCKED`, public exact URL presence maps to `OBSERVED`, and only authenticated positive evidence maps to `CONFIRMED_INDEXED`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
npx vitest run tests/phase7-public-evidence.test.ts
```

Expected: FAIL because the Phase 7 evidence collector and status mapper do not exist.

- [ ] **Step 3: Implement the minimal collector and matrix builder**

Collect the existing 54-URL public observation method, brand/local/priority long-tail queries, Google Maps place evidence, public Facebook candidates, supplier/manufacturer directory candidates, and external mentions. Emit explicit source, checked time, confidence, and limitation fields; never promote a weak candidate to verified.

- [ ] **Step 4: Run focused tests and public collection**

Run:

```bash
npx vitest run tests/phase7-public-evidence.test.ts
npx tsx scripts/collect-phase7-public-evidence.ts
```

Expected: tests PASS and all four evidence artifacts parse as valid JSON.

- [ ] **Step 5: Run Common Crawl and backlink verification**

Run:

```bash
python3 /Users/khaduy/.codex/skills/seo/scripts/commoncrawl_graph.py mdftungphat.com --json
```

Verify every claimed source URL directly before counting it as a referring domain or citation. Mark JavaScript-only social pages `UNVERIFIABLE_JS`, never removed.

### Task 3: Strengthen Existing Citation Assets Without Adding Pages

**Files:**
- Modify: `app/tham-chieu-vat-lieu/page.tsx`
- Modify: `lib/material-reference.ts`
- Modify: `tests/material-reference.test.ts`
- Evaluate: `content/articles/chuan-bi-file-cnc.md`

**Interfaces:**
- Consumes: existing material dataset, comparison matrix CSV/JSON, source tiers, verification date, and existing CNC checklist.
- Produces: concise methodology, source hierarchy, unknown handling, manufacturer-fact distinction, stable citation instructions, and unchanged URL count.

- [ ] **Step 1: Write failing tests for citation metadata**

Add assertions that the generated material comparison JSON includes methodology fields for included data, source tiers, unknown handling, last verification, and the distinction between manufacturer facts and Tùng Phát guidance.

- [ ] **Step 2: Run the focused material tests and confirm failure**

Run:

```bash
npx vitest run tests/material-reference.test.ts
```

Expected: FAIL because the methodology object is not yet exported.

- [ ] **Step 3: Add the minimal methodology and citation guidance**

Extend the existing JSON distribution and the existing `/tham-chieu-vat-lieu/` page with a concise methodology block. Preserve all numeric and product claims, add no fake statistics, and keep the existing row anchors and downloads.

- [ ] **Step 4: Evaluate the existing CNC checklist**

Confirm whether print/download/stable-anchor improvements already exist. Change it only if the existing resource lacks a useful, evidence-safe feature; do not add machine-specific claims.

- [ ] **Step 5: Run material tests and build-generated asset checks**

Run:

```bash
npx vitest run tests/material-reference.test.ts
npm run prebuild
```

Expected: tests PASS and generated CSV/JSON remain valid.

### Task 4: Build External Authority And Outreach Handoff

**Files:**
- Modify: `data/authority-opportunities.json`
- Create: `docs/external-authority-outreach-pack.md`
- Create: `reports/phase7-authority-opportunities.json`
- Modify: `data/entity-corroboration.json`
- Modify: `scripts/build-entity-graph.ts`
- Create: `reports/entity-graph-v5.json`

**Interfaces:**
- Consumes: verified NAP, Task 1 ownership results, Task 2 public evidence, strongest existing assets, and public contact methods.
- Produces: up to 20 quality opportunities, audience-specific citation contexts, safe outreach templates, updated entity states, and evidence-backed graph edges only.

- [ ] **Step 1: Rank legitimate external opportunities**

Score each candidate using `Trust x Relevance x Local Value x Citation Benefit`. Exclude SEO farms, reciprocal networks, mass directories, and any supplier claim without explicit public evidence.

- [ ] **Step 2: Create the outreach pack**

Include the factual business description, verified NAP, material matrix and CNC checklist citation contexts, short audience-specific templates, and a clear list of claims that must not be made.

- [ ] **Step 3: Update entity evidence and graph V5**

Add only verified or consistently observed edges. Retain `UNVERIFIED`, `MISSING`, and `AUTH_BLOCKED` for surfaces that cannot be proven. Run:

```bash
ENTITY_GRAPH_OUTPUT=reports/entity-graph-v5.json npx tsx scripts/build-entity-graph.ts
```

Expected: graph counts match source records and no unverified URL is used as a verified `sameAs` edge.

### Task 5: Verify, Deploy, And Recheck Production

**Files:**
- Create: `reports/phase7-verification.json`
- Create: `reports/phase7-lighthouse-1.json`
- Create: `reports/phase7-lighthouse-2.json`
- Create: `reports/phase7-lighthouse-3.json`
- Update generated audit reports under `reports/`.

**Interfaces:**
- Consumes: Tasks 1-4 changes and existing repository verification commands.
- Produces: exact pass/fail counts, final production SHA/deployment, 54-URL crawl evidence, and performance/security maintenance evidence.

- [ ] **Step 1: Install dependencies and run the full local gate**

Run:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm --prefix cloudflare-cms test
npm run build
npm run test:e2e
npm run validate:links
npm run validate:schema
npm run audit:catalogue-quality
npm run validate:provenance
npm audit --omit=dev --json
```

Record failures accurately; a skipped command is not a pass.

- [ ] **Step 2: Review the diff for secrets, schema, URL count, and scope**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Confirm no tokens, private verification data, unverified `sameAs`, new indexable pages, or heavy third-party widgets were added.

- [ ] **Step 3: Commit, push, merge, and deploy only when code changed**

Commit the verified Phase 7 changes, push `codex/phase7-indexation-authority-20260810`, create/merge a PR with `gh` if authenticated, and verify Vercel deployment reaches `READY`. If platform auth blocks merge/deploy, record the exact blocker and continue public checks against the latest reachable production.

- [ ] **Step 4: Crawl and measure final production**

Run the production audit, schema/link checks, bot-access checks, security-header/source-map checks, and three mobile Lighthouse runs. Use the median and compare it with Phase 6.

### Task 6: Run Final Search Benchmarks And Build Handoff

**Files:**
- Create: `reports/phase7-search-benchmark.json`
- Create: `reports/phase7-search-presence.json`
- Create: `reports/phase7-result.json`
- Update: `reports/search-monitor-history.json`

**Interfaces:**
- Consumes: final production deployment, exact 40-query set, priority long-tail and brand query set, Task 1-5 evidence, and production metrics.
- Produces: P7 benchmark, search presence ladder, concise bottleneck diagnosis, top 10 next actions, blockers, and complete Git/external handoff.

- [ ] **Step 1: Run the exact 40-query benchmark once**

Run:

```bash
AI_BENCHMARK_OUTPUT=reports/phase7-search-benchmark.json npm run benchmark:search
```

Expected: exactly 40 queries with unchanged category selection methodology.

- [ ] **Step 2: Run priority long-tail, brand, and local observations**

Use the collector from Task 2 for brand, phone, legal name, Tam Binh, Thu Duc, material, CNC, comparison, and file-preparation intent. Record Google and Bing separately and include surface/location limitations.

- [ ] **Step 3: Build the final machine-readable result**

Aggregate production, GSC, Bing, ladder levels, local entity table, external authority counts, entity graph before/after, asset changes, benchmark, performance, verification, blockers, and Git/external actions into `reports/phase7-result.json`.

- [ ] **Step 4: Apply the completion evidence gate**

Re-run every command supporting a final PASS/PARTIAL/BLOCKED statement, read exit codes and counts, and report `PARTIAL` when authenticated ownership remains a critical blocker despite completed independent work.

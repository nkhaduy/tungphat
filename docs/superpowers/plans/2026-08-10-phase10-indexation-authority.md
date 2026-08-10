# Phase 10 Indexation And Authority Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce authenticated indexation evidence where access exists, convert legitimate citation opportunities where channels exist, and measure authority/search propagation without changing the public page population.

**Architecture:** Work in the isolated Phase 10 branch from the newest `origin/main`. Treat authenticated platform data, public search observations, citation/link verification, local ownership, and production health as separate evidence streams, then combine them in a final result without inferring missing data.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Lighthouse CLI, public HTTP/Bing RSS, Google/Bing API capability checks, GitHub CLI, Vercel CLI.

## Global Constraints

- Production acceptance URL is `https://mdftungphat.com`.
- Starting main is `b480d77237cafa4a2d08cd398b532672e1ac96ef`, the current valid `origin/main` after fetch.
- Do not re-audit Phase 1-9, add indexable pages, create generic blog content, or expand catalogue URLs for SEO.
- Check authenticated capabilities once; do not expose credentials or retry absent auth repeatedly.
- Do not claim indexation, search performance, outreach transmission, link acceptance, ownership, AI retrieval, or AI citation without direct evidence.
- Run the unchanged query methods once near completion; do not manipulate the query set.
- Do not deploy or submit IndexNow when no canonical public URL changes.

---

### Task 1: Safe Workspace And Capability Baseline

**Files:**
- Create: `reports/phase10-auth-capabilities.json`

**Interfaces:**
- Consumes: remote Git state, worktrees, processes, browser discovery, API/CLI auth checks, email/Zalo capability signals.
- Produces: clean isolated starting state and one-time capability matrix.

- [ ] Fetch and inspect `origin/main`, worktrees, dirt, stashes, processes, and concurrent Codex work.
- [ ] Create the isolated Phase 10 worktree and install dependencies.
- [ ] Run the complete unit baseline and record exact counts.
- [ ] Check Google, Microsoft, Facebook, business email, and Zalo/business-channel capability once.

### Task 2: Authenticated Indexation And Performance

**Files:**
- Create: `reports/phase10-gsc-performance.json`
- Create: `reports/confirmed-indexation-phase10.json`
- Create: `reports/phase10-bing-webmaster.json`

**Interfaces:**
- Consumes: the one-time auth matrix, sitemap population, and nine priority URLs.
- Produces: confirmed indexation classifications, sitemap/inspection facts, impressions/clicks, and truthful nulls.

- [ ] Use GSC/Bing Webmaster APIs or authenticated UI only when capability exists.
- [ ] Inspect the nine priority URLs and broader sitemap population when quota and ownership permit.
- [ ] Capture clicks, impressions, CTR, position, top queries/pages, sitemap, manual/security issues, and first-impression evidence exactly as exposed.
- [ ] Preserve public exact-domain observations separately from authenticated indexation.

### Task 3: Authority Conversion And Local Ownership

**Files:**
- Create: `data/authority-outreach-status-phase10.json`
- Create: `data/authority-opportunities-phase10.json`
- Create: `data/referring-domain-history-phase10.json`
- Create: `data/nap-consistency-phase10.json`
- Create: `reports/phase10-external-actions.json`

**Interfaces:**
- Consumes: Phase 9 authority pipeline, canonical identity, live external pages, and authenticated sender/owner channels.
- Produces: one Thanh Thuy follow-up, verified known-link states, legitimate transmissions, and at most ten new high-certainty candidates.

- [ ] Recheck Thanh Thuy exactly once and accept only a live canonical link.
- [ ] Send Infocom, Daily Chu Ky So, DauThau.Net, Ashui, or Kien Viet actions only through legitimate authenticated channels; preserve blockers otherwise.
- [ ] Verify known citations/links for `LIVE`, `LOST`, `CHANGED`, `UNLINKED`, or `PENDING` state.
- [ ] Discover and deduplicate at most ten new high-certainty authority candidates; exclude scrapers, mirrors, spam directories, and unrelated entities.
- [ ] Check GBP, Bing Places, Facebook, and Zalo ownership/administration only when authenticated access exists.

### Task 4: Search Presence And Entity Graph

**Files:**
- Create: `reports/phase10-exact-domain-search.json`
- Create: `reports/phase10-search-presence.json`
- Create: `reports/phase10-search-benchmark.json`
- Create: `reports/entity-graph-v8.json`
- Create: `reports/phase10-authority-evidence.json`

**Interfaces:**
- Consumes: unchanged Phase 9 queries, authority verification, and local entity evidence.
- Produces: independent Google/Bing ladder levels, brand/local/long-tail observations, 40-query result, typed graph deltas, and AI nulls/observations.

- [ ] Run exact-domain, exact brand, local brand, and stable long-tail observations without changing queries.
- [ ] Run the exact 40-query benchmark once near the end.
- [ ] Record first-party, Maps, Facebook, and third-party results separately.
- [ ] Update typed graph edges and lost edges only from direct evidence.
- [ ] Keep AI retrieval/citation `null` unless directly measurable.

### Task 5: Regression, Performance, And Handoff

**Files:**
- Create: `reports/production-crawl-phase10.json`
- Create: `reports/phase10-lighthouse-1.json`
- Create: `reports/phase10-lighthouse-2.json`
- Create: `reports/phase10-lighthouse-3.json`
- Create: `reports/phase10-verification.json`
- Create: `reports/phase10-result.json`

**Interfaces:**
- Consumes: Tasks 1-4 evidence and current production output.
- Produces: final PASS/PARTIAL/BLOCKED result, public-change decision, exact Git/external handoff, and production acceptance evidence.

- [ ] Verify sitemap population, catalogue, robots, knowledge assets, schema, internal links, crawler access, security headers, source maps, and credential patterns.
- [ ] Run three mobile Lighthouse samples and compare the medians to the Phase 9 maintenance thresholds.
- [ ] Make no public code change unless direct evidence proves a regression or entity correction is required.
- [ ] Validate all Phase 10 JSON, metric cross-checks, authority counts, and outreach state claims.
- [ ] Commit/push evidence, open and merge a PR when authenticated, and avoid deployment/IndexNow when canonical public output is unchanged.

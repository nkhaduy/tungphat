# Phase 9 Authority Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine whether the Phase 8 LCP change is a real production defect, convert or accurately progress existing authority opportunities, and measure the first evidence of indexation and branded search without adding public pages.

**Architecture:** Work from an isolated branch at the latest `origin/main`, keep all public website output frozen unless repeatable performance evidence identifies a defect, and persist Phase 9 observations as deterministic JSON evidence. Authenticated surfaces are checked once; public performance, crawl, citation, mention, and search monitoring continue independently when account access is unavailable.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Lighthouse CLI, Chrome DevTools performance traces, public HTTP endpoints, GitHub CLI, Vercel CLI.

## Global Constraints

- Production acceptance URL is `https://mdftungphat.com`.
- Starting production main is `3fd91e55ab5a664b8afbb67a55930952ac05678f` unless a newer valid `origin/main` appears.
- Do not re-audit Phase 1-8, add indexable pages, expand the catalogue without business value, or write generic blog content.
- Check authenticated Google, Microsoft, Facebook, and communication capabilities once, then continue controllable work.
- Do not claim indexation, outreach transmission, link acceptance, profile ownership, or authority conversion without direct evidence.
- Maximum new outreach submissions is five; pending requests are not resubmitted without evidence of failure.
- Only verified official profiles may enter schema `sameAs`.
- Do not deploy or submit IndexNow when public canonical URLs are unchanged.

---

### Task 1: Workspace And Authentication Baseline

**Files:**
- Create: `reports/phase9-auth-capabilities.json`

**Interfaces:**
- Consumes: Git remote state, worktrees, stashes, processes, browser availability, Google/backlink credentials, GitHub and Vercel sessions.
- Produces: one-time capability matrix and verified Phase 9 starting state.

- [x] Fetch `origin/main`, inspect local dirt, worktrees, stashes, and concurrent project processes.
- [x] Create `.worktrees/phase9-authority-conversion` on `codex/phase9-authority-conversion-20260810` from `origin/main`.
- [x] Run credential checks without exposing secrets and record every unavailable authenticated surface as `AUTH_BLOCKED`.
- [x] Install dependencies and verify the existing unit-test baseline before creating Phase 9 evidence.

### Task 2: LCP Variance Forensics

**Files:**
- Create: `reports/phase9-lighthouse-1.json` through `reports/phase9-lighthouse-5.json`
- Create: `reports/phase9-lcp-variance.json`

**Interfaces:**
- Consumes: Phase 7 and Phase 8 Lighthouse reports, production resource headers, Chrome DevTools trace, current homepage source.
- Produces: per-run metrics, good/bad phase comparison, cache/CDN evidence, and an evidence-backed code-change decision.

- [x] Run five mobile Lighthouse tests using the unchanged production URL, including sequential and spaced samples.
- [x] Record score, LCP, FCP, TBT, CLS, TTFB, LCP element, phase breakdown, resource timing, size, priority, protocol, and timestamp for every run.
- [x] Compare representative Phase 7/8 good and bad traces to Phase 9, including cache and Vercel POP observations.
- [x] Inspect the homepage source for discovery, preload, render gating, animation, hydration, CSS, decode, sizing, and font dependencies.
- [x] Make no public change unless a repeatable code defect is isolated.

### Task 3: Authority Conversion And Discovery

**Files:**
- Create: `data/authority-outreach-status-phase9.json`
- Create: `data/authority-opportunities-phase9.json`
- Create: `data/referring-domain-history-phase9.json`
- Create: `reports/phase9-authority-evidence.json`
- Create: `reports/phase9-external-actions.json`

**Interfaces:**
- Consumes: Phase 8 outreach state, canonical identity, live source pages, public mention searches, legitimate correction channels.
- Produces: one-time Thanh Thuy recheck, truthful blocked/sent/accepted states, new verified mentions, and source-class-separated authority counts.

- [x] Recheck the exact Thanh Thuy distributor page once and mark `ACCEPTED` only if the canonical link is live.
- [x] Preserve Infocom and Daily Chu Ky So as blocked unless an authenticated communication route is actually available.
- [x] Search exact name, tax ID, domain, phone, and both branch addresses; deduplicate known sources and exclude scraper spam.
- [x] Verify new entity-specific sources directly when possible and score only high-confidence reclamation opportunities.
- [x] Identify up to five relevant editorial targets for the existing material reference and CNC checklist; do not transmit without a legitimate authenticated channel.

### Task 4: Indexation And Search Presence

**Files:**
- Create: `reports/indexation-observations-phase9.json`
- Create: `reports/confirmed-indexation-phase9.json`
- Create: `reports/phase9-search-presence.json`
- Create: `reports/phase9-search-benchmark.json`

**Interfaces:**
- Consumes: one-time auth matrix, production sitemap, unchanged 15-query presence set, unchanged 40-query benchmark.
- Produces: explicit authenticated nulls, public fallback observations, exact-domain result separation, and Phase 9 ladder evidence.

- [x] Use GSC and Bing Webmaster only if authenticated; otherwise keep confirmed indexation and search data null.
- [x] Run public fallback observations for all 54 sitemap URLs without treating absence as non-indexation.
- [x] Run the unchanged brand/local/long-tail monitor and the exact unchanged 40-query benchmark once near final.
- [x] Track exact-domain, Maps, Facebook, third-party citation, and first-party website observations separately.

### Task 5: Entity Graph And Verification Handoff

**Files:**
- Create: `data/nap-consistency-phase9.json`
- Create: `reports/entity-graph-v7.json`
- Create: `reports/production-crawl-phase9.json`
- Create: `reports/phase9-verification.json`
- Create: `reports/phase9-result.json`

**Interfaces:**
- Consumes: Tasks 1-4 evidence and current production state.
- Produces: typed evidence edges, final Phase 9 result, exact Git/external handoff, and no-change/deployment decision.

- [x] Add only evidence-backed platform identity, business citation, supplier/manufacturer, editorial, social, and local-place edges.
- [x] Run production crawl, schema/link quality checks, security smoke, authority-data validation, and final Lighthouse summary.
- [x] Confirm no indexable page growth, no new `sameAs`, no secret exposure, and no unsupported outreach state.
- [ ] Commit and push Phase 9 evidence, open and merge a PR when repository authentication allows it, and verify production remains ready.

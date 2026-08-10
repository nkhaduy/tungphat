# Phase 8 External Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase truthful independent corroboration of Tùng Phát, reclaim appropriate canonical links, and measure real indexation/search authority without adding indexable pages.

**Architecture:** Attempt authenticated Google, Microsoft, and Facebook administration once, then continue with public-source verification and legitimate external contact channels regardless of account blockers. Persist evidence in deterministic JSON datasets for canonical identity, NAP comparison, outreach state, referring domains, mentions, entity edges, indexation, search presence, and Phase 7-to-8 deltas; change public code only when a verified external fact requires it.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Node.js CLI scripts, public web endpoints, authenticated browser surfaces when available, GitHub CLI, Vercel CLI.

## Global Constraints

- Production acceptance URL is `https://mdftungphat.com`.
- Base work on verified `origin/main` SHA `9791f42393b8cf9108f98b661a06c9e10e48a822` unless a newer valid main appears.
- Do not re-audit Phase 1-7, add indexable pages, add generic blog content, or modify technical foundations that remain passing.
- Retry Google, Microsoft, and Facebook authentication once; record `AUTH_BLOCKED` and continue when unavailable.
- Do not submit duplicate listings, false partnerships, paid links, mass outreach, legal attestations, or unverified business fields.
- Maximum outreach is 10 individually relevant messages; maximum new listing attempts is 5.
- Do not mark messages `SENT` or forms `SUBMITTED` unless transmission is directly observed.
- Only verified official profiles may enter schema `sameAs`.
- Use exact Phase 2-7 search methodology and report `0` or `null` honestly.
- Do not redeploy when no public website change is required.

---

### Task 1: Safe Workspace And Capability Baseline

**Files:**
- Create: `reports/phase8-auth-attempts.json`
- Create: `reports/phase8-production-baseline.json`

**Interfaces:**
- Consumes: Git remote/worktree/process state, local SEO credentials, browser sessions, production headers and sitemap.
- Produces: verified starting SHA, clean branch state, single-attempt auth results, and production deployment/crawl baseline.

- [ ] Verify `origin/main`, worktrees, dirty files, stashes, branches, and concurrent processes.
- [ ] Create `codex/phase8-external-authority-20260810` from `origin/main` in `.worktrees/phase8-external-authority`.
- [ ] Run Google and backlink credential checks without printing credential contents.
- [ ] Connect once to the available browser and check Google, Microsoft, and Facebook signed-in state.
- [ ] Record exact authenticated, unauthenticated, owner-verification, CAPTCHA, or unavailable outcomes.

### Task 2: Rebuild Verified Authority Evidence

**Files:**
- Create: `data/canonical-business-identity.json`
- Create: `data/nap-consistency-phase8.json`
- Create: `data/referring-domain-history.json`
- Create: `data/brand-mention-monitor.json`
- Create: `reports/phase8-authority-evidence.json`

**Interfaces:**
- Consumes: Phase 7 evidence, first-party contact/schema data, two Maps place IDs, current public citations and mentions.
- Produces: branch-level source of truth, field-level NAP classifications, verified live backlinks, and linked/unlinked/ambiguous mention inventory.

- [ ] Re-verify the official site, Maps branches, Thanh Thùy, Daily Chữ Ký Số, Infocom, Facebook candidate, Zalo, and low-confidence mention.
- [ ] Classify each public field as `EXACT`, `ACCEPTABLE_VARIANT`, `MATERIAL_MISMATCH`, `FIELD_MISSING`, or `UNVERIFIED`.
- [ ] Count referring domains once per domain and retain source URL, target URL, context, first-seen, last-seen, and status.
- [ ] Separate independent external citation edges from first-party and platform identity edges.

### Task 3: Execute Reclamation And Local Entity Actions

**Files:**
- Create: `data/authority-outreach-status.json`
- Update: `docs/external-authority-outreach-pack.md`
- Create: `reports/phase8-external-actions.json`

**Interfaces:**
- Consumes: verified identity data, legitimate contact/correction channels, authenticated sessions, Phase 7 templates.
- Produces: truthful transmission statuses and ready-to-send requests for blocked channels.

- [ ] Verify the Thanh Thùy distributor entry and locate its official correction/contact channel.
- [ ] Submit the concise canonical-link request only when a real channel is available and no ownership/legal attestation is required.
- [ ] Review the other three mentions and four business citations for link utility and correction eligibility.
- [ ] Attempt up to five reputable profile/listing corrections or claims without creating duplicates.
- [ ] Record `SENT`, `SUBMITTED`, `READY_TO_SEND`, `BLOCKED_CHANNEL`, or `NOT_APPROPRIATE` only from observed outcomes.

### Task 4: Prioritize Authority Opportunities And Entity Graph V6

**Files:**
- Create: `data/authority-opportunities-phase8.json`
- Create: `reports/entity-graph-v6.json`
- Create: `reports/authority-quality-phase8.json`
- Create: `reports/search-discovery-delta-phase8.json`

**Interfaces:**
- Consumes: Phase 7 backlog, Phase 8 evidence, manufacturer/dealer locators, local commerce platforms, material-reference relevance.
- Produces: P0/P1/P2 actionable set, edge-type-aware entity graph, internal evidence scores, and Phase 7-to-8 delta.

- [ ] Re-score 20 opportunities using authority value, relevance, evidence confidence, and actionability.
- [ ] Identify only explicit manufacturer/supplier eligibility and mark unavailable proof `BUSINESS_EVIDENCE_REQUIRED`.
- [ ] Select 3-5 P0 and 5-8 P1 actions; execute P0 where a safe channel exists.
- [ ] Score sources internally without presenting the score as a Google metric.

### Task 5: Indexation, Brand, Long-Tail, And Benchmark Measurement

**Files:**
- Create: `reports/confirmed-indexation-phase8.json`
- Create: `reports/phase8-search-presence.json`
- Create: `reports/phase8-search-benchmark.json`
- Update: `reports/search-monitor-history.json`

**Interfaces:**
- Consumes: authenticated GSC/Bing data if available, production sitemap, exact stable query sets.
- Produces: 54-URL indexation matrix with nulls where blocked, separate Google/Bing ladder levels, and exact 40-query Phase 8 observation.

- [ ] Inspect the nine priority URLs in GSC/Bing only when authenticated; request indexing once only when justified.
- [ ] Build all-54 indexation records with explicit `unknown` values when authentication is unavailable.
- [ ] Run stable branded, phone, local, and high-intent long-tail checks without changing queries to find the brand.
- [ ] Run the unchanged 40-query benchmark once near completion.

### Task 6: Acceptance Verification And Git Handoff

**Files:**
- Create: `reports/production-crawl-phase8.json`
- Create: `reports/phase8-verification.json`
- Create: `reports/phase8-result.json`

**Interfaces:**
- Consumes: Tasks 1-5 artifacts and production state.
- Produces: final PASS/PARTIAL/BLOCKED evidence, exact external mutation handoff, and clean Git status.

- [ ] Install dependencies and run focused JSON/data tests plus the production crawl, schema, links, catalogue quality, provenance, security, and secret scans appropriate to an external-only change.
- [ ] Run a mobile Lighthouse maintenance sample and record any observed outlier without chasing a perfect score.
- [ ] Review diffs for secrets, fabricated transmission status, unsupported facts, unverified `sameAs`, and indexable page-count growth.
- [ ] Commit and push durable Phase 8 evidence; create/merge a PR when repository authentication allows it.
- [ ] Do not deploy unless public site output changed; verify current production deployment remains `READY`.

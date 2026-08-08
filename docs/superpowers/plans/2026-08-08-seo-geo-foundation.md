# SEO/GEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before commits.

**Goal:** Build a crawlable, entity-resolved, fact-rich, extractable, and automatically verifiable SEO/GEO foundation for `mdftungphat.com`.

**Architecture:** Reuse the existing Next.js static export and content settings as the single source of truth. Generate canonical schema relationships and machine-readable artifacts from published content, then enforce the output with deterministic tests and crawl metrics.

**Tech Stack:** Next.js 15 App Router, TypeScript, React 19, Vitest, Playwright, Node.js validation scripts, static export on Vercel.

## Global Constraints

- Do not invent business facts, prices, stock, reviews, authors, certifications, partners, service areas, or technical capabilities.
- Preserve canonical host `https://mdftungphat.com` and trailing-slash page URLs.
- Keep drafts and thin placeholder pages out of the index and sitemap.
- Do not deploy, push, or merge.

---

### Task 1: Canonical schema graph

**Files:** `lib/seo.ts`, page/template components, `tests/seo-schema.test.ts`

- [ ] Add failing unit tests for canonical WebPage identifiers and primary-entity relationships.
- [ ] Implement reusable WebPage schema helpers using existing absolute URL functions.
- [ ] Attach WebPage nodes to homepage, listings, products, services, articles, projects, contact, and legal templates where visible content supports them.
- [ ] Normalize Product and Service IDs/URLs to canonical trailing-slash URLs.
- [ ] Run focused tests and schema URL validation.

### Task 2: Machine-readable discovery artifacts

**Files:** `lib/knowledge.ts`, `app/knowledge.json/route.ts`, `public/llms.txt`, `tests/knowledge.test.ts`

- [ ] Add failing tests for public-only knowledge serialization, canonical URLs, and exclusion of drafts/noindex content.
- [ ] Implement the knowledge dataset from business settings and published content.
- [ ] Add a static JSON route and concise `llms.txt` with sitemap and dataset links.
- [ ] Verify both files exist in the static export and contain no unsupported claims.

### Task 3: SEO output audit and quality gate

**Files:** `scripts/audit-seo-output.mjs`, `scripts/lib/seo-output-audit.mjs`, `tests/seo-output-audit.test.ts`, `package.json`

- [ ] Add failing fixture tests for duplicate metadata, broken canonicals, invalid schema, orphan pages, thin indexable pages, sitemap mismatch, and broken internal links.
- [ ] Implement deterministic HTML/XML analysis and JSON metrics output.
- [ ] Add `audit:seo` and include the gate in post-build validation.
- [ ] Capture baseline and after metrics from production/static output.

### Task 4: Direct answer, trust, and operational resources

**Files:** homepage components/content, project image descriptions, `data/ai-search-query-set.json`, `docs/geo-offsite-strategy.md`

- [ ] Add a failing browser/output assertion for a visible direct-answer block.
- [ ] Add the factual homepage answer block and remove unverified image provenance wording.
- [ ] Add at least 100 categorized AI/search queries with target URLs, answer elements, and priorities.
- [ ] Document off-site corroboration work that cannot be completed in the repository.

### Task 5: IndexNow and delivery headers

**Files:** `scripts/submit-indexnow.mjs`, `tests/indexnow.test.ts`, `vercel.json`, `.env.example`, `docs/SEO-OPERATIONS.md`

- [ ] Add failing tests for missing-key safety, sitemap URL extraction, and change-hash suppression.
- [ ] Implement environment-only IndexNow submission with dry-run and force options.
- [ ] Add Vercel sitewide security/robots-safe headers without blocking public crawlers.
- [ ] Document key provisioning and non-spam operation.

### Task 6: Full verification and commit

**Files:** all intentional changes

- [ ] Run lint, root and CMS typechecks, unit tests, build, link audit, schema audit, SEO output audit, and e2e tests against an isolated local server.
- [ ] Crawl the final static output and compare measured metrics with production baseline.
- [ ] Request an independent code review and resolve Critical/Important findings.
- [ ] Review diff, exclude runtime/cache artifacts, commit intentional changes, and report branch/worktree/base/final SHA.


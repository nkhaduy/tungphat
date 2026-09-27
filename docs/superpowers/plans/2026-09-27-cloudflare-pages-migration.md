# Cloudflare Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the public static Next.js site from Vercel to Cloudflare Pages without changing public URLs, SEO signals, or unrelated subdomains.

**Architecture:** `next.config.mjs` already creates a static export in `out/`; Cloudflare Pages serves that directory. Pages `_headers` and `_redirects` replace Vercel deployment rules, and an automated sitemap-based parity script compares current production with a Pages deployment before DNS changes.

**Tech Stack:** Next.js 15.5.21, React 19, Node 22, npm, Cloudflare Pages, Wrangler 4, Vitest, Playwright.

**Spec:** User request dated 2026-09-27.

## Global Constraints

- `MIGRATION_TARGET = PAGES`: static export has no SSR, API runtime, Server Actions, middleware, or optimized-image server requirement.
- Preserve `https://mdftungphat.com` as canonical, including trailing slash behavior, redirects, sitemap, robots, metadata, and schema.
- Do not alter `baogia.mdftungphat.com`, `cms.mdftungphat.com`, `cdn.mdftungphat.com`, mail records, or Vercel fallback.
- Never commit secrets, `.env*`, tokens, or credential files.
- Run `npm run verify` before production deployment and verify `https://mdftungphat.com` after cutover.

---

### Task 1: Capture Production and Deployment Baselines

**Files:**
- Create: `scripts/compare-hosting-parity.ts`
- Create: `tests/hosting-parity.test.ts`
- Create: ignored `reports/cloudflare-migration/production-baseline.json`

**Interfaces:**
- Consumes: current and candidate origins, with current sitemap URLs as the only URL source.
- Produces: per-route JSON for HTTP status, final URL, redirect chain, title, canonical, description, robots, and schema count.

- [ ] **Step 1: Write a failing test**

    it("reports a canonical mismatch", () => {
      expect(comparePageSignals(current, candidate).mismatches).toContain("canonical");
    });

- [ ] **Step 2: Run the test**

    npm test -- tests/hosting-parity.test.ts

    Expected: FAIL because `comparePageSignals` does not exist.

- [ ] **Step 3: Implement minimal comparison code**

    export function comparePageSignals(current: PageAudit, candidate: PageAudit) {
      return { mismatches: fields.filter((field) => current[field] !== candidate[field]) };
    }

    The CLI uses bounded concurrency, maps sitemap routes to the candidate host, and never prints environment values.

- [ ] **Step 4: Verify and record baseline**

    npm test -- tests/hosting-parity.test.ts
    npx tsx scripts/compare-hosting-parity.ts --current https://mdftungphat.com --candidate https://mdftungphat.com --output reports/cloudflare-migration/production-baseline.json

    Expected: test PASS and zero mismatches.

- [ ] **Step 5: Commit**

    git add scripts/compare-hosting-parity.ts tests/hosting-parity.test.ts .gitignore
    git commit -m "chore: add Cloudflare migration parity audit"

### Task 2: Preserve Vercel Routing Rules on Pages

**Files:**
- Modify: `public/_redirects`
- Modify: `public/_headers`
- Modify: `tests/hosting-parity.test.ts`

**Interfaces:**
- Consumes: redirects, rewrite, and header scopes in `vercel.json`.
- Produces: Pages static routing files in `out/`, while retaining `vercel.json` unchanged as rollback configuration.

- [ ] **Step 1: Write failing route-rule assertions**

    expect(redirects).toContain("/ma-mau /catalogue/ 301");
    expect(redirects).toContain("/catalog/* https://cms.mdftungphat.com/media/catalog/:splat 200");
    expect(headers).toContain("/cms-preview/*");

- [ ] **Step 2: Run the assertions**

    npm test -- tests/hosting-parity.test.ts

    Expected: FAIL because the current Pages files are incomplete.

- [ ] **Step 3: Add equivalent Pages rules**

    Copy every Vercel redirect, preserve the catalogue proxy as an external 200 rewrite, and add `cms-preview` noindex/cache headers. Keep Vercel configuration untouched.

- [ ] **Step 4: Build and prove output includes routing files**

    npm run build
    npm test -- tests/hosting-parity.test.ts
    test -f out/_redirects && test -f out/_headers

- [ ] **Step 5: Commit**

    git add public/_redirects public/_headers tests/hosting-parity.test.ts
    git commit -m "fix: preserve production routing on Cloudflare"

### Task 3: Repair Pages Configuration and Deploy Preview

**Files:**
- Modify: `package.json`
- Create: `docs/cloudflare-migration.md`
- Modify: Pages project settings through Wrangler/API only after reproducing the existing failure.

**Interfaces:**
- Consumes: `npm ci`, `npm run build`, `out/`, and public environment-variable names.
- Produces: an independent Pages preview URL that serves the static export.

- [ ] **Step 1: Reproduce the existing Pages Git build failure**

    Inspect project settings and build history, then run the configured install/build sequence locally without secrets.

- [ ] **Step 2: Make the smallest correction**

    Set Node 22, install `npm ci`, build `npm run build`, output `out`, and configure only necessary public variable names for production and preview.

- [ ] **Step 3: Run required verification and deploy preview**

    npm run verify
    npx wrangler pages deploy out --project-name tungphat --branch cloudflare-migration

- [ ] **Step 4: Compare and smoke test preview**

    Run the full parity CLI, then Playwright against homepage, catalogue, product, article, form CTA, assets, mobile viewport, and console errors.

- [ ] **Step 5: Commit and push**

    git add package.json docs/cloudflare-migration.md
    git commit -m "chore: add Cloudflare Pages deployment configuration"
    git push origin main

### Task 4: Cut Over and Verify Production

**Files:**
- Modify: `docs/cloudflare-migration.md`

**Interfaces:**
- Consumes: verified Pages deployment and the authoritative DNS snapshot.
- Produces: `mdftungphat.com` on Pages and a documented Git-and-DNS rollback path to untouched Vercel deployments.

- [ ] **Step 1: Attach only apex and www domains to Pages**

    Do not change non-apex DNS records; wait for Pages TLS readiness before changing DNS at the authoritative provider.

- [ ] **Step 2: Enforce www-to-apex canonical redirect**

    Configure a permanent redirect to `https://mdftungphat.com/:path` without applying `noindex` to the production hostname.

- [ ] **Step 3: Deploy Pages production**

    npm run verify
    npx wrangler pages deploy out --project-name tungphat --branch main

- [ ] **Step 4: Verify the live hostname**

    Verify DNS, Cloudflare response headers, complete sitemap parity, robots/sitemap/favicon/manifest, redirects/404, browser console, and the three unrelated subdomain answers.

- [ ] **Step 5: Document, commit, and push**

    git add docs/cloudflare-migration.md
    git commit -m "docs: record Cloudflare Pages migration"
    git push origin main

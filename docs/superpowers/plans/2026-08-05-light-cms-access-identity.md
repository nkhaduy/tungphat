# Light CMS Cloudflare Access Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the staging password request path with verified Cloudflare Access identity authentication while preserving PBKDF2 rollback code and all production/cost constraints.

**Architecture:** The Worker verifies the Access JWT with Web Crypto and a bounded JWKS cache, then performs a fresh D1 identity/role lookup for every private request. Authentication is sessionless; mutations use exact-Origin plus a stateless CSRF token, and the Pages gateway only transports the verified JWT while stripping untrusted identity headers.

**Tech Stack:** Cloudflare Workers, Pages Functions service binding, D1, R2, Web Crypto RS256/HMAC-SHA256, React 19, Vite 7, Vitest 3, TypeScript 5.9.

## Global Constraints

- Workers Paid activation remains `CANCELLED`; no paid subscription, add-on, pay-as-you-go selection, or billing confirmation.
- Production CMS and website provider remain Decap; production DNS and provider variables are unchanged.
- Payload, Decap, D1, R2, and existing password hashes are preserved.
- Cloudflare Access is the only staging identity provider attempted.
- The staging bundle must not import PBKDF2 or expose password login.
- Remote gate remains zero 1102, zero 5xx, p99 CPU `<= 8 ms`, max CPU `<= 9 ms`.

---

### Task 1: Access JWT verifier and JWKS cache

**Files:**
- Create: `light-cms/src/worker/security/access-jwt.ts`
- Create: `light-cms/tests/fixtures/access-keys.ts`
- Create: `light-cms/tests/access-jwt.test.ts`

**Interfaces:**
- Produces: `AccessJwksCache`, `verifyAccessJwt(token, config, options)`, `AccessIdentityClaims`, and cache metrics.

- [ ] Write failing signed-fixture tests for missing/malformed JWT, algorithm, signature, issuer, audience, expiry, `nbf`, `iat`, email/subject, unknown `kid`, refresh, cache hit, cache miss, and JWKS failure.
- [ ] Run `npm test -- tests/access-jwt.test.ts` and confirm failures are caused by the missing verifier.
- [ ] Implement strict RS256 parsing, Web Crypto verification, claim validation, TTL-capped JWKS caching, request deduplication, and one forced unknown-key refresh.
- [ ] Re-run `npm test -- tests/access-jwt.test.ts` and confirm all tests pass.

### Task 2: D1 identity authorization and stateless CSRF

**Files:**
- Create: `light-cms/migrations/0002_access_identity.sql`
- Create: `light-cms/src/worker/security/access-auth.ts`
- Create: `light-cms/tests/access-auth.test.ts`
- Modify: `light-cms/src/contracts/api.ts`

**Interfaces:**
- Consumes: verified Access claims from Task 1.
- Produces: `authenticateAccessRequest`, `requireAccessMutation`, `AccessUser`, and audit behavior.

- [ ] Write failing tests for unknown user, disabled user, normalized email, first subject bind, email mismatch, subject collision, denied login audit, successful login audit, immediate disable, and stateless CSRF.
- [ ] Run `npm test -- tests/access-auth.test.ts` and verify the expected failures.
- [ ] Add identity columns/indexes without deleting legacy credentials.
- [ ] Implement fresh D1 lookup, fail-closed identity binding, login/denial audit, and HMAC-derived CSRF.
- [ ] Re-run the focused tests and migration tests.

### Task 3: Worker router and RBAC conversion

**Files:**
- Modify: `light-cms/src/worker/index.ts`
- Modify: `light-cms/src/worker/security/rbac.ts`
- Modify: `light-cms/tests/worker.integration.test.ts`
- Modify: `light-cms/tests/rbac.test.ts`

**Interfaces:**
- Consumes: Task 2 authentication context for every private route.
- Produces: Access-only `/api/auth/session`, `/api/auth/logout`, immutable identity management, and existing content/media/version APIs.

- [ ] Write failing integration tests for missing JWT, forged email header, authenticated unknown/disabled users, editor publish denial, admin escalation denial, immutable email/subject, Access logout URL, and private no-store responses.
- [ ] Run focused integration/RBAC tests and confirm the failures.
- [ ] Remove password/session imports and login route from the staging router, authenticate each private request, attach JWKS metrics, and update user management to identity-only fields.
- [ ] Re-run focused tests and all Worker tests.

### Task 4: Same-origin gateway hardening

**Files:**
- Modify: `light-cms/functions/api/[[path]].ts`
- Create: `light-cms/tests/gateway.test.ts`

**Interfaces:**
- Produces: one-shot streaming proxy that preserves JWT/status/body/headers and strips unverified identity headers.

- [ ] Write failing tests for header stripping, JWT forwarding, one upstream call, exact status preservation, private cache preservation, and public cache preservation.
- [ ] Run `npm test -- tests/gateway.test.ts` and confirm failures.
- [ ] Implement the minimal transparent gateway with no retry/catch/status rewriting.
- [ ] Re-run gateway tests.

### Task 5: Access login UI and logout behavior

**Files:**
- Modify: `light-cms/src/admin/api.ts`
- Modify: `light-cms/src/admin/app.tsx`
- Modify: `light-cms/src/admin/screens/LoginScreen.tsx`
- Create: `light-cms/tests/login-ui.test.tsx`

**Interfaces:**
- Produces: no-password Vietnamese login state, Access login navigation, automatic dashboard entry, generic denial copy, and Access logout navigation.

- [ ] Write failing DOM tests proving no password/email inputs, the exact login button, generic denial text, and logout redirect behavior.
- [ ] Run `npm test -- tests/login-ui.test.tsx` and confirm failures.
- [ ] Replace credential submit APIs with `session()`, `beginAccessLogin()`, and logout URL handling.
- [ ] Re-run UI tests and accessibility checks.

### Task 6: Legacy isolation, bootstrap, and benchmark clients

**Files:**
- Move: `light-cms/src/worker/security/password.ts` to `light-cms/src/worker/security/legacy/password.ts`
- Move: `light-cms/src/worker/security/session.ts` to `light-cms/src/worker/security/legacy/session.ts`
- Modify: `light-cms/scripts/bootstrap-staging.ts`
- Modify: `light-cms/scripts/remote-e2e.ts`
- Modify: `light-cms/scripts/benchmark-staging.ts`
- Create: `light-cms/scripts/scan-access-bundle.ts`
- Create: `light-cms/tests/bundle-isolation.test.ts`

**Interfaces:**
- Produces: explicit staging identity bootstrap, session-reuse benchmark input, and executable bundle/route scan.

- [ ] Write failing tests for PBKDF2 import isolation and password route absence.
- [ ] Run the focused test and confirm it fails against the current bundle/source graph.
- [ ] Move legacy modules, seed only pre-approved identity rows, consume a real externally supplied Access session for remote tools, and add bundle scanning.
- [ ] Build and run the scan, confirming no PBKDF2/password endpoint in staging output.

### Task 7: Full local acceptance and reports

**Files:**
- Create/update all reports in `docs/free-light-cms/` required by the acceptance brief.
- Modify: `docs/free-light-cms/STAGING_ROLLBACK_RUNBOOK.md`

**Interfaces:**
- Produces: reproducible evidence and a final `PASSED` or `BLOCKED` verdict.

- [ ] Run local tests, contracts, Worker integration, D1/R2 local, identity/JWT, RBAC, CSRF, versions, audit, migration, idempotency, provider parity, E2E, Axe, security, secret scan, bundle scan, typecheck, lint, build, and `git diff --check`.
- [ ] Record exact counts and failures without copying tokens or secrets into artifacts.
- [ ] Update implementation, security, benchmark, migration, parity, deployment, rollback, and baseline reports.

### Task 8: Cloudflare Access Free staging and remote acceptance

**Files:**
- Modify: `light-cms/wrangler.worker.jsonc` only with non-secret Access issuer/audience settings after an application exists.

**Interfaces:**
- Produces: staging-only Access application/policy, real JWT/session verification, and real benchmark evidence.

- [ ] Activate only Zero Trust Free if no payment method/overage authorization/subscription confirmation is required.
- [ ] Create explicit-email, staging-only Pages and Worker policies with a 12-hour session and no admin API bypass.
- [ ] Deploy the Access build and run the complete real-session workload and cold/warm CPU sampling.
- [ ] Declare `LIGHT CMS STAGING ACCEPTANCE PASSED` only if every functional/security/CPU gate passes; otherwise declare `LIGHT CMS STAGING BLOCKED` with the exact blocker.

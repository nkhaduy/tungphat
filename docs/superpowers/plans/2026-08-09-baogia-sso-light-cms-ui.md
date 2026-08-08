# Baogia SSO Light CMS UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve Light CMS directly at `cms.mdftungphat.com`, authenticate active Baogia `ADMIN` users through one-time ES256 SSO, remove Cloudflare Access from the CMS path, and port the Baogia login/admin visual system without regressing CMS features.

**Architecture:** Baogia remains the credential and identity authority and signs a 30-second ES256 assertion after validating its existing session. Light CMS verifies the assertion, records its `jti` once in CMS D1, creates a 30-minute host-only CMS session, and enforces CMS authorization and CSRF server-side. Pages stays a transparent same-origin gateway; the custom domain is canonical and the `pages.dev` hostname redirects toward it.

**Tech Stack:** React 19, Vite 7, TypeScript strict mode, Hono, Cloudflare Workers/Pages, D1, R2, Web Crypto ES256, Vitest, Playwright, Axe, Wrangler 4.

## Global Constraints

- Work only in `/Users/khaduy/Downloads/tungphat-light-cms-worktree` on `codex/light-cms-staging`; never switch, reset, clean, or stash the repository root.
- Do not activate Workers Paid, accept billing, create subscriptions, mutate unrelated production DNS, change the production website provider, delete Decap/Payload, or write SSO data to Baogia D1/R2.
- `CMS_PROVIDER` for the production website remains `decap`; Payload data remains preserved.
- Only active, non-deleted Baogia users with `role=ADMIN` may enter CMS; `EMPLOYEE` users are denied.
- CMS never receives Baogia passwords, password hashes, session cookies, or `SESSION_SECRET`.
- The deployed CMS bundle contains no password form, password login route, PBKDF2 request path, Cloudflare Access JWT dependency, or client-trusted identity header.
- Private APIs use `Cache-Control: no-store`, exact Origin checks, CSRF, server-side authorization, no retry, and no status masking.
- Remote acceptance requires zero 1102, zero 5xx, CPU p99 at most 8 ms, and CPU maximum at most 9 ms.
- The production website, production Decap CMS, Payload resources, quote records, quote PDFs, and billing stay unchanged.

---

### Task 1: Stabilize the Current Worktree and Restore the Baogia Source

**Files:**
- Verify: `docs/free-light-cms/WORKTREE_SNAPSHOT_MANIFEST.md`
- Restore from commit `69012c2`: `quote-app/`
- Modify: `.git/info/exclude` or the linked-worktree equivalent
- Commit: all existing Light CMS implementation paths listed by the snapshot manifest, excluding `.DS_Store`, secrets, `.wrangler/`, and `.superpowers/`

**Interfaces:**
- Consumes: current dirty Light CMS worktree and Baogia source object at commit `69012c2`.
- Produces: a reproducible baseline commit containing the existing Light CMS implementation plus a cleanly restored `quote-app/` subtree.

- [ ] **Step 1: Confirm the worktree identity and classify every dirty path**

Run:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
sed -n '1,240p' docs/free-light-cms/WORKTREE_SNAPSHOT_MANIFEST.md
```

Expected: branch is `codex/light-cms-staging`; no path is staged except plan/spec work; `.DS_Store` is excluded from all commits.

- [ ] **Step 2: Scan the baseline for credentials before staging**

Run:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' --glob '!.wrangler/**' '(api[_-]?token|account[_-]?id|client[_-]?secret|private[_-]?key|BEGIN (RSA|EC|PRIVATE)|SESSION_SECRET\s*=)' light-cms docs/free-light-cms cloudflare-cms e2e-light-cms lib tests package.json package-lock.json
```

Expected: only variable names, fixtures, redacted evidence, and documentation appear; no live credential value is staged.

- [ ] **Step 3: Restore the exact Baogia application source without switching branches**

Run:

```bash
test ! -e quote-app
git restore --source=69012c2 -- quote-app
git status --short -- quote-app
```

Expected: `quote-app/` is added from commit `69012c2`; existing Light CMS paths are untouched.

- [ ] **Step 4: Exclude the visual-companion session locally**

Resolve the linked-worktree git directory with `git rev-parse --git-path info/exclude`, then add exactly:

```text
.superpowers/
```

Expected: `git status --short` no longer lists `.superpowers/`; the exclusion is local and is not committed.

- [ ] **Step 5: Run baseline tests before changing authentication**

Run:

```bash
npm --prefix light-cms test
npm --prefix light-cms run typecheck
npm --prefix quote-app install
npm --prefix quote-app test
npm --prefix quote-app run typecheck
```

Expected: record the exact baseline result in `docs/free-light-cms/SESSION_RESUME_AUDIT.md`; failures already present are documented rather than hidden.

- [ ] **Step 6: Commit the stable pre-SSO baseline**

Stage only Light CMS-related paths named in the snapshot manifest plus `quote-app/`. Do not stage `.DS_Store`, `.superpowers/`, local Wrangler state, or secrets.

```bash
git diff --cached --check
git commit -m "chore: snapshot Light CMS before Baogia SSO"
```

Expected: one baseline commit; unrelated user files remain dirty and unstaged.

---

### Task 2: Add Baogia ES256 Assertion Signing

**Files:**
- Create: `quote-app/src/worker/sso.ts`
- Create: `quote-app/tests/sso.test.ts`
- Modify: `quote-app/.dev.vars.example`
- Modify: `quote-app/wrangler.worker.jsonc`
- Modify/generated: `quote-app/worker-configuration.d.ts`

**Interfaces:**
- Consumes: `QuoteAppEnv.CMS_SSO_PRIVATE_JWK`, authenticated `SessionUser`, and current Unix time.
- Produces: `signCmsAssertion(user, env, now): Promise<string>` and `cmsSsoForm(assertion, state, callback): Response`.

- [ ] **Step 1: Write failing signing tests using a real P-256 keypair**

Add tests that generate a keypair with Web Crypto and assert exact protected header and claims:

```ts
const assertion = await signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk) }, 1_786_213_600);
const [header, payload, signature] = assertion.split(".");
expect(JSON.parse(decode(header))).toEqual({ alg: "ES256", kid: "baogia-cms-2026-08", typ: "JWT" });
expect(JSON.parse(decode(payload))).toEqual(expect.objectContaining({
  iss: "https://baogia.mdftungphat.com",
  aud: "tungphat-light-cms",
  sub: admin.id,
  username: admin.username,
  role: "ADMIN",
  iat: 1_786_213_600,
  nbf: 1_786_213_595,
  exp: 1_786_213_630,
}));
expect(base64UrlDecode(signature)).toHaveLength(64);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm --prefix quote-app test -- --run tests/sso.test.ts
```

Expected: FAIL because `src/worker/sso.ts` does not exist.

- [ ] **Step 3: Implement the signer and fixed callback form**

Use these exact public types and constants:

```ts
export const CMS_SSO_ISSUER = "https://baogia.mdftungphat.com";
export const CMS_SSO_AUDIENCE = "tungphat-light-cms";
export const CMS_SSO_CALLBACK = "https://cms.mdftungphat.com/api/auth/sso/callback";
export const CMS_SSO_KEY_ID = "baogia-cms-2026-08";

export type CmsSsoClaims = {
  v: 1; iss: string; aud: string; sub: string; username: string;
  name: string; role: "ADMIN"; iat: number; nbf: number; exp: number; jti: string;
};

export async function signCmsAssertion(
  user: Pick<SessionUser, "id" | "username" | "fullName" | "role">,
  env: Pick<QuoteAppEnv, "CMS_SSO_PRIVATE_JWK">,
  now = Math.floor(Date.now() / 1000),
): Promise<string>;
```

Reject a missing/malformed private JWK with HTTP 503, require `user.role === "ADMIN"`, sign `header.payload` with `{ name: "ECDSA", hash: "SHA-256" }`, and HTML-escape every hidden form value. `cmsSsoForm` returns `Cache-Control: no-store`, `Content-Type: text/html; charset=UTF-8`, `Referrer-Policy: no-referrer`, and CSP `default-src 'none'; form-action https://cms.mdftungphat.com; script-src 'unsafe-inline'`.

- [ ] **Step 4: Generate Worker types and run focused verification**

Run:

```bash
npm --prefix quote-app run cf:typegen
npm --prefix quote-app test -- --run tests/sso.test.ts
npm --prefix quote-app run typecheck
```

Expected: all commands pass and `QuoteAppEnv` includes `CMS_SSO_PRIVATE_JWK`.

- [ ] **Step 5: Commit**

```bash
git add quote-app/src/worker/sso.ts quote-app/tests/sso.test.ts quote-app/.dev.vars.example quote-app/wrangler.worker.jsonc quote-app/worker-configuration.d.ts
git commit -m "feat: sign Light CMS SSO assertions in Baogia"
```

---

### Task 3: Add the Baogia Authorization Route and Safe Login Resume

**Files:**
- Create: `quote-app/src/client/sso-return.ts`
- Create: `quote-app/tests/sso-return.test.ts`
- Modify: `quote-app/src/client/pages/LoginPage.tsx`
- Modify: `quote-app/src/client/pages/ChangePasswordPage.tsx`
- Modify: `quote-app/src/worker/auth.ts`
- Modify: `quote-app/src/worker/index.ts`
- Extend: `quote-app/tests/sso.test.ts`

**Interfaces:**
- Consumes: existing Baogia session cookie `tp_quote_session` and CMS-provided state.
- Produces: `resolveAuthenticatedUser(request, env): Promise<SessionUser | null>`, `safeSsoReturn(search): string | null`, and `GET /api/auth/sso/cms?state=...`.

- [ ] **Step 1: Write failing tests for safe resume and route behavior**

Test these exact cases:

```ts
expect(safeSsoReturn("?returnTo=%2Fapi%2Fauth%2Fsso%2Fcms%3Fstate%3Dabc_123")).toBe("/api/auth/sso/cms?state=abc_123");
expect(safeSsoReturn("?returnTo=https%3A%2F%2Fevil.example")).toBeNull();
expect(safeSsoReturn("?returnTo=%2Fapi%2Fadmin%2Fusers")).toBeNull();
```

Route tests assert: no session redirects to `/login?returnTo=...`; `EMPLOYEE` returns 403; active `ADMIN` returns a no-store auto-submit form targeting the exact CMS callback; state outside `[A-Za-z0-9_-]{32,128}` returns 422.

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm --prefix quote-app test -- --run tests/sso-return.test.ts tests/sso.test.ts
```

Expected: FAIL for missing helper, resolver, and route.

- [ ] **Step 3: Refactor session resolution without changing normal Baogia auth**

Extract the cookie/JWT/D1 lookup from `authenticate` into:

```ts
export async function resolveAuthenticatedUser(
  request: Request,
  env: Pick<QuoteAppEnv, "DB" | "SESSION_SECRET">,
  now = Math.floor(Date.now() / 1000),
): Promise<{ user: SessionUser; csrf: string; sessionHash: string } | null>;
```

Keep `authenticate` behavior and error messages unchanged by calling this resolver. Do not update Baogia D1 from the new SSO route.

- [ ] **Step 4: Implement exact allowlisted resume behavior**

`safeSsoReturn` accepts only `/api/auth/sso/cms?state=<validated-state>`. `LoginPage` reads this value; when already authenticated or after a successful login it uses `window.location.assign(returnTo)`. If `mustChangePassword` is set, carry the same safe value through `/doi-mat-khau`; `ChangePasswordPage` resumes it only after password change succeeds. Without it, retain the current ADMIN/EMPLOYEE/password-change routing.

- [ ] **Step 5: Register the public SSO route before global API authentication**

Implement:

```ts
app.get("/api/auth/sso/cms", async (c) => {
  const state = c.req.query("state") ?? "";
  if (!/^[A-Za-z0-9_-]{32,128}$/u.test(state)) throw new HttpError(422, "Yêu cầu đăng nhập CMS không hợp lệ.");
  const resolved = await resolveAuthenticatedUser(c.req.raw, c.env);
  if (!resolved) return c.redirect(`/login?returnTo=${encodeURIComponent(`/api/auth/sso/cms?state=${state}`)}`, 302);
  if (resolved.user.mustChangePassword) return c.redirect(`/doi-mat-khau?returnTo=${encodeURIComponent(`/api/auth/sso/cms?state=${state}`)}`, 302);
  if (resolved.user.role !== "ADMIN") throw new HttpError(403, "Bạn chưa được cấp quyền quản trị CMS.");
  return cmsSsoForm(await signCmsAssertion(resolved.user, c.env), state, CMS_SSO_CALLBACK);
});
```

Keep this route outside `requirePasswordChanged`; an ADMIN with a forced password change must complete that change before assertion issuance.

- [ ] **Step 6: Run Baogia regression gates**

Run:

```bash
npm --prefix quote-app test
npm --prefix quote-app run lint
npm --prefix quote-app run typecheck
npm --prefix quote-app run build
```

Expected: existing Baogia behavior passes; new SSO tests pass.

- [ ] **Step 7: Commit**

```bash
git add quote-app/src/client/sso-return.ts quote-app/tests/sso-return.test.ts quote-app/src/client/pages/LoginPage.tsx quote-app/src/client/pages/ChangePasswordPage.tsx quote-app/src/worker/auth.ts quote-app/src/worker/index.ts quote-app/tests/sso.test.ts
git commit -m "feat: authorize Light CMS from Baogia sessions"
```

---

### Task 4: Add CMS SSO Schema, ES256 Verification, Replay Protection, and Sessions

**Files:**
- Create: `light-cms/migrations/0003_baogia_sso.sql`
- Create: `light-cms/src/worker/security/baogia-jwt.ts`
- Create: `light-cms/src/worker/security/baogia-sso.ts`
- Move/refactor: `light-cms/src/worker/security/legacy/session.ts` to `light-cms/src/worker/security/session.ts`
- Create: `light-cms/tests/fixtures/baogia-sso-keys.ts`
- Create: `light-cms/tests/baogia-jwt.test.ts`
- Create: `light-cms/tests/baogia-sso.test.ts`
- Modify: `light-cms/tests/helpers/sqlite-d1.ts`

**Interfaces:**
- Consumes: ES256 assertion, SSO state cookie, CMS D1, `SESSION_SECRET`, and `BAOGIA_SSO_PUBLIC_JWK`.
- Produces: `verifyBaogiaAssertion`, `startBaogiaSso`, `completeBaogiaSso`, `createSession`, `verifySession`, `revokeSession`, and `requireMutation`.

- [ ] **Step 1: Write the migration and failing schema tests**

The migration adds:

```sql
ALTER TABLE users ADD COLUMN baogia_subject TEXT;
ALTER TABLE users ADD COLUMN baogia_username TEXT;
CREATE UNIQUE INDEX users_baogia_subject_unique_idx ON users(baogia_subject) WHERE baogia_subject IS NOT NULL;

CREATE TABLE sso_assertion_uses (
  jti_hash TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER NOT NULL
);
CREATE INDEX sso_assertion_expiry_idx ON sso_assertion_uses(expires_at);
```

Update the SQLite test helper to apply migrations `0001`, `0002`, and `0003` in order. Assert duplicate `baogia_subject` and duplicate `jti_hash` fail.

- [ ] **Step 2: Write failing cryptographic and session tests**

Use a real P-256 fixture to cover valid signature, missing token, malformed segments, wrong `alg`, signature, `iss`, `aud`, `sub`, role, future `nbf`, future `iat`, expired `exp`, lifetime over 30 seconds, and unknown `kid`. Session tests cover tampered cookie, expiry, revoked row, disabled local shadow user, CSRF mismatch, and wrong Origin.

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm --prefix light-cms test -- --run tests/baogia-jwt.test.ts tests/baogia-sso.test.ts tests/auth.test.ts
```

Expected: FAIL for the missing migration and modules.

- [ ] **Step 4: Implement strict ES256 verification**

Expose:

```ts
export type BaogiaIdentity = {
  subject: string; username: string; displayName: string; role: "ADMIN";
  issuedAt: number; notBefore: number; expiresAt: number; jti: string;
};

export async function verifyBaogiaAssertion(
  assertion: string,
  config: { issuer: string; audience: string; publicJwk: JsonWebKey; keyId: string },
  now = Math.floor(Date.now() / 1000),
): Promise<BaogiaIdentity>;
```

Accept only `alg=ES256`, `typ=JWT`, and the configured `kid`; require exactly three non-empty segments and a 64-byte signature; import the public key with `crypto.subtle.importKey("jwk", ..., { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])`; fail closed on every parse/import/verify error.

- [ ] **Step 5: Implement state, shadow-user upsert, replay consumption, and session issuance**

`startBaogiaSso` sets `tp_light_sso_state` for 10 minutes and returns a 302 to `https://baogia.mdftungphat.com/api/auth/sso/cms?state=<random>`. `completeBaogiaSso` accepts only form-urlencoded POST, compares form state to the host-only cookie, verifies the assertion, atomically inserts `sha256(jti)` in `sso_assertion_uses`, and upserts a shadow user after computing `const subjectHash = await sha256(identity.subject)`:

```ts
{
  id: `baogia-${subjectHash.slice(0, 24)}`,
  email: `sso-${subjectHash.slice(0, 24)}@baogia.invalid`,
  name: identity.displayName,
  display_name: identity.displayName,
  role: "super-admin",
  password_hash: "!baogia-sso!",
  active: 1,
  status: "active",
  baogia_subject: identity.subject,
  baogia_username: identity.username,
}
```

Never match or update a row by display name. A subject collision fails closed and is audited.

- [ ] **Step 6: Activate the CMS session module**

Use cookie `tp_light_session`, 30-minute fixed expiry, signed payload plus D1 session hash, and existing `sessions` columns. Rename the environment secret to `SESSION_SECRET`; do not import the legacy password module. `verifySession` must require active status and return role `super-admin` for SSO users.

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm --prefix light-cms test -- --run tests/baogia-jwt.test.ts tests/baogia-sso.test.ts tests/auth.test.ts tests/migration.test.ts
npm --prefix light-cms run typecheck
```

Expected: all focused tests pass.

- [ ] **Step 8: Commit**

```bash
git add light-cms/migrations/0003_baogia_sso.sql light-cms/src/worker/security/baogia-jwt.ts light-cms/src/worker/security/baogia-sso.ts light-cms/src/worker/security/session.ts light-cms/tests/fixtures/baogia-sso-keys.ts light-cms/tests/baogia-jwt.test.ts light-cms/tests/baogia-sso.test.ts light-cms/tests/helpers/sqlite-d1.ts light-cms/tests/auth.test.ts light-cms/tests/migration.test.ts
git commit -m "feat: verify Baogia SSO and issue CMS sessions"
```

---

### Task 5: Replace Cloudflare Access in the CMS Worker

**Files:**
- Modify: `light-cms/src/worker/index.ts`
- Modify: `light-cms/src/worker/cloudflare.d.ts`
- Modify: `light-cms/src/contracts/api.ts`
- Modify: `light-cms/src/worker/security/rbac.ts`
- Remove: `light-cms/src/worker/security/access-auth.ts`
- Remove: `light-cms/src/worker/security/access-jwt.ts`
- Remove: `light-cms/tests/access-auth.test.ts`
- Remove: `light-cms/tests/access-jwt.test.ts`
- Replace: `light-cms/tests/worker-access.integration.test.ts` with `light-cms/tests/worker-sso.integration.test.ts`
- Modify: `light-cms/tests/security.test.ts`
- Modify: `light-cms/tests/rbac.test.ts`

**Interfaces:**
- Consumes: active CMS session and SSO handlers from Task 4.
- Produces: `/api/auth/sso/start`, `/api/auth/sso/callback`, `/api/auth/session`, `/api/auth/logout`, read-only `/api/users`, and unchanged CMS/public content APIs.

- [ ] **Step 1: Write failing Worker integration tests**

Cover these exact outcomes:

```text
GET  /health                         200 public
GET  /api/public/snapshot            200 public/cacheable
GET  /api/auth/sso/start              302 Baogia
POST /api/auth/sso/callback           302 / and Set-Cookie
GET  /api/auth/session without cookie 401
GET  /api/auth/session with cookie    200 user + csrf
POST /api/auth/logout valid CSRF      200 + cleared cookie
POST /api/products valid session      existing behavior
POST /api/products wrong Origin       403
POST /api/users                       405
PATCH/DELETE /api/users/:id           405
GET  /api/users                       200 read-only shadow identities
```

Also prove forged `Cf-Access-*`, `X-Auth-Request-*`, and `X-Baogia-*` headers do not authenticate a request.

- [ ] **Step 2: Run the integration test and verify failure**

Run:

```bash
npm --prefix light-cms test -- --run tests/worker-sso.integration.test.ts
```

Expected: FAIL because the Access router is still active.

- [ ] **Step 3: Replace the environment contract**

`LightCmsEnv` contains:

```ts
DB: D1Database;
MEDIA: R2Bucket;
APP_SECRET: string;
SESSION_SECRET: string;
BAOGIA_SSO_ISSUER: string;
BAOGIA_SSO_AUD: string;
BAOGIA_SSO_PUBLIC_JWK: string;
BAOGIA_SSO_KEY_ID: string;
ENVIRONMENT?: string;
ALLOWED_ORIGINS?: string;
SERVICE_NAME?: string;
```

Remove `ACCESS_ISSUER`, `ACCESS_AUD`, `ACCESS_JWKS_URL`, Access cache metrics, and `Cf-Access-Jwt-Assertion` authentication. Delete the Access verifier/authorization modules and their dedicated tests after the SSO replacement tests pass.

- [ ] **Step 4: Wire public auth routes before session authentication**

Route order is health, public snapshot/media, SSO start, SSO callback, session, then authenticated CMS routes. `GET /api/auth/session` uses `verifySession`; `POST /api/auth/logout` requires Origin/CSRF, deletes the D1 session, audits `auth.logout`, and clears only `tp_light_session`.

- [ ] **Step 5: Replace Access mutation checks and make users read-only**

Use `requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session)` everywhere. `usersRoute` supports only collection GET and returns `id`, `baogia_username`, `display_name`, `role`, `status`, and `last_login_at`; all create/update/delete methods return 405. Keep authorization checks server-side.

- [ ] **Step 6: Run Worker/security/RBAC tests**

Run:

```bash
npm --prefix light-cms test -- --run tests/worker-sso.integration.test.ts tests/security.test.ts tests/rbac.test.ts tests/repository.test.ts tests/media.integration.test.ts
npm --prefix light-cms run typecheck
```

Expected: all pass with no Access header requirement.

- [ ] **Step 7: Commit**

```bash
git add light-cms/src/worker/index.ts light-cms/src/worker/cloudflare.d.ts light-cms/src/contracts/api.ts light-cms/src/worker/security/rbac.ts light-cms/tests/worker-sso.integration.test.ts light-cms/tests/security.test.ts light-cms/tests/rbac.test.ts
git rm light-cms/src/worker/security/access-auth.ts light-cms/src/worker/security/access-jwt.ts light-cms/tests/access-auth.test.ts light-cms/tests/access-jwt.test.ts light-cms/tests/worker-access.integration.test.ts
git commit -m "feat: authenticate Light CMS with Baogia SSO sessions"
```

---

### Task 6: Make the Gateway and Custom Domain Canonical

**Files:**
- Modify: `light-cms/functions/api/[[path]].ts`
- Modify: `light-cms/functions/_shared/legacy-proxy.ts`
- Modify: `light-cms/functions/index.ts`
- Modify: `light-cms/deploy/production-pages/functions/api/[[path]].ts`
- Modify: `light-cms/deploy/production-pages/functions/index.ts`
- Modify: `light-cms/deploy/production-pages/wrangler.jsonc`
- Modify: `light-cms/wrangler.worker.jsonc`
- Modify: `light-cms/wrangler.worker.production.jsonc`
- Modify: `light-cms/tests/gateway.test.ts`
- Modify: `light-cms/tests/production-entry.test.ts`
- Modify: `light-cms/tests/production-guard.test.ts`

**Interfaces:**
- Consumes: CMS SSO routes and session cookies.
- Produces: transparent same-origin gateway and one-way `pages.dev` to `cms.mdftungphat.com` canonical redirect.

- [ ] **Step 1: Rewrite failing canonical-host tests**

Assert `https://cms.mdftungphat.com/anything` calls `next()` unchanged. Assert `https://tungphat-light-cms-production.pages.dev/anything?x=1` returns 308 to `https://cms.mdftungphat.com/anything?x=1`. Assert other preview branch hostnames are served normally during pre-cutover testing.

- [ ] **Step 2: Add failing gateway header tests**

Browser requests containing `Cf-Access-Jwt-Assertion`, any `Cf-Access-*`, `X-Auth-Request-*`, `X-Baogia-*`, or `X-Light-CMS-Internal-*` must reach the Worker without those headers. The gateway must preserve the CMS cookie, `Set-Cookie`, status, body, CSRF header, 1102, and 5xx responses and call the service binding once.

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm --prefix light-cms test -- --run tests/gateway.test.ts tests/production-entry.test.ts tests/production-guard.test.ts
```

Expected: canonical custom-host test fails against the current 302 redirect.

- [ ] **Step 4: Implement canonical behavior and SSO gateway prefixes**

Add `/api/auth/sso/start` and `/api/auth/sso/callback` to `lightCmsPrefixes`. Remove `ACCESS_ADMIN_ORIGIN`. `functions/index.ts` becomes:

```ts
const canonicalHost = "cms.mdftungphat.com";
const productionPagesHost = "tungphat-light-cms-production.pages.dev";

export async function onRequest(context: PagesContext) {
  const url = new URL(context.request.url);
  if (url.hostname !== productionPagesHost) return context.next();
  url.hostname = canonicalHost;
  url.protocol = "https:";
  url.port = "";
  return new Response(null, { status: 308, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
}
```

- [ ] **Step 5: Update Worker/Pages production variables**

Remove Access variables. Configure exact SSO issuer `https://baogia.mdftungphat.com`, audience `tungphat-light-cms`, key ID `baogia-cms-2026-08`, and allowed Origin `https://cms.mdftungphat.com`. Keep `LEGACY_CMS_ORIGIN`, the service binding, D1 ID, R2 bucket, and production website configuration unchanged.

- [ ] **Step 6: Run focused tests and dry-run builds**

Run:

```bash
npm --prefix light-cms test -- --run tests/gateway.test.ts tests/production-entry.test.ts tests/production-guard.test.ts
npm --prefix light-cms run worker:dry-run
npm --prefix light-cms run worker:production:dry-run
```

Expected: tests pass and both Worker bundles build without Access bindings.

- [ ] **Step 7: Commit**

```bash
git add light-cms/functions light-cms/deploy/production-pages/functions light-cms/deploy/production-pages/wrangler.jsonc light-cms/wrangler.worker.jsonc light-cms/wrangler.worker.production.jsonc light-cms/tests/gateway.test.ts light-cms/tests/production-entry.test.ts light-cms/tests/production-guard.test.ts
git commit -m "fix: keep Light CMS on its canonical custom domain"
```

---

### Task 7: Port the Baogia Visual System to Light CMS

**Files:**
- Copy from `quote-app/public/`: `light-cms/public/logo-horizontal.png`, `light-cms/public/logo-square.png`, `light-cms/public/login-workshop.webp`
- Modify: `light-cms/src/admin/app.tsx`
- Modify: `light-cms/src/admin/api.ts`
- Modify: `light-cms/src/admin/components/Layout.tsx`
- Create: `light-cms/src/admin/components/NavIcon.tsx`
- Modify: `light-cms/src/admin/screens/LoginScreen.tsx`
- Modify: `light-cms/src/admin/screens/DashboardScreen.tsx`
- Modify: `light-cms/src/admin/screens/DataScreen.tsx`
- Modify: `light-cms/src/admin/styles.css`
- Modify: `light-cms/src/admin/environment.ts`
- Modify: `light-cms/tests/login-ui.test.tsx`
- Create: `light-cms/tests/layout-ui.test.tsx`

**Interfaces:**
- Consumes: `/api/auth/session`, `/api/auth/sso/start`, `/api/auth/logout`, and existing CMS data APIs.
- Produces: Baogia-matched login/error shell, admin sidebar/header, responsive navigation, read-only users UI, and unchanged editor functionality.

- [ ] **Step 1: Write failing UI tests**

Assert that logged-out startup automatically navigates to `/api/auth/sso/start`; a failed SSO shows logo, `Đăng nhập`, `Đăng nhập bằng tài khoản Báo Giá`, and the workshop background; Layout contains the exact CMS menu labels; user role is displayed as `Quản trị viên`; Users screen has no create/edit/delete control and links to `https://baogia.mdftungphat.com/admin/nhan-vien`.

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```bash
npm --prefix light-cms test -- --run tests/login-ui.test.tsx tests/layout-ui.test.tsx
```

Expected: FAIL against the current Cloudflare Access login copy and old shell.

- [ ] **Step 3: Copy the approved Baogia assets and structural styles**

Reuse the exact assets from the restored quote app. Port the Baogia CSS variables, Montserrat faces, white 250px sidebar, forest active item, orange icons/focus, compact top bar, card/table/form borders, and responsive drawer from `quote-app/src/client/styles.css`. Keep Light CMS-specific editor layout rules and all accessibility focus styles.

- [ ] **Step 4: Replace Access login/logout behavior**

`App` calls `session()` once. A 401 navigates to `/api/auth/sso/start` unless `?auth_error=` is present; an error state renders the Baogia-style login screen and retry button. CMS logout clears the CMS session and returns to the branded screen. A separate `Đăng xuất tất cả` link navigates to the Baogia logout URL only after CMS logout succeeds.

- [ ] **Step 5: Port navigation and operational screens**

Use Lucide icons matching Baogia. Menu labels are Tổng quan, Sản phẩm, Bài viết, Dự án, Trang, Media, Cài đặt, Người dùng, Phiên bản, and Nhật ký. Preserve existing Content, Media, Settings, Preview, Publish, Unpublish, Restore, Versions, and Audit actions; only restyle their containers and controls.

- [ ] **Step 6: Run UI, accessibility-unit, type, and build checks**

Run:

```bash
npm --prefix light-cms test -- --run tests/login-ui.test.tsx tests/layout-ui.test.tsx tests/environment.test.ts
npm --prefix light-cms run typecheck
npm --prefix light-cms run build:production
```

Expected: tests pass; assets load from same origin; no Access wording appears in `dist`.

- [ ] **Step 7: Commit**

```bash
git add light-cms/public light-cms/src/admin light-cms/tests/login-ui.test.tsx light-cms/tests/layout-ui.test.tsx
git commit -m "feat: match Light CMS UI to Baogia"
```

---

### Task 8: Replace Access Scripts, Security Suites, and Local E2E

**Files:**
- Replace: `light-cms/scripts/access-session-input.ts` with `light-cms/scripts/sso-session-input.ts`
- Replace: `light-cms/scripts/benchmark-access-local.ts` with `light-cms/scripts/benchmark-sso-local.ts`
- Replace: `light-cms/scripts/scan-access-bundle.ts` with `light-cms/scripts/scan-sso-bundle.ts`
- Modify: `light-cms/scripts/benchmark-staging.ts`
- Modify: `light-cms/scripts/remote-e2e.ts`
- Modify: `light-cms/package.json`
- Modify: `light-cms/tests/bundle-isolation.test.ts`
- Modify: `light-cms/tests/production-entry.test.ts`
- Modify/create: `e2e-light-cms/sso.spec.ts`
- Modify: `playwright.light-cms.config.ts`

**Interfaces:**
- Consumes: local signing fixture and deployed/session input.
- Produces: SSO benchmark metrics, a bundle/route scan, and browser coverage for Baogia-to-CMS login.

- [ ] **Step 1: Write failing bundle assertions**

The scan fails if Worker or SPA artifacts contain `Cf-Access-Jwt-Assertion`, `ACCESS_AUD`, `ACCESS_ISSUER`, `/cdn-cgi/access`, `/api/auth/login`, `PBKDF2`, `password_hash`, or the password form labels. It also fails if `/api/auth/sso/callback`, ES256 verification, CSRF, and session revocation are absent.

- [ ] **Step 2: Write local E2E fixtures and cases**

Run a local Baogia Worker and Light CMS Worker/Pages pair. Tests cover logged-out CMS to Baogia login and back, existing Baogia session auto-entry, employee denial, invalid state, replayed assertion, CMS-only logout, full logout, 390px mobile sidebar, and all existing CMS CRUD/publish/restore/media flows.

- [ ] **Step 3: Replace Access-specific scripts and package commands**

Package commands become:

```json
{
  "benchmark:sso-local": "tsx scripts/benchmark-sso-local.ts",
  "scan:sso-bundle": "tsx scripts/scan-sso-bundle.ts dist .wrangler/sso-bundle"
}
```

The local benchmark records ES256 cold/warm verify, assertion replay D1 insert, session create/check/revoke, CSRF, gateway, D1 query counts, wall time, and errors. No script sends OTP or uses Access cookies.

- [ ] **Step 4: Run the complete Light CMS local gate**

Run:

```bash
npm --prefix light-cms run lint
npm --prefix light-cms run typecheck
npm --prefix light-cms test
npm --prefix light-cms run build:production
npm --prefix light-cms run worker:production:dry-run
npm --prefix light-cms run benchmark:sso-local
npm --prefix light-cms run scan:sso-bundle
npm run test:e2e:light
```

Expected: every command passes; bundle scan reports zero legacy auth matches.

- [ ] **Step 5: Commit**

```bash
git add light-cms/scripts light-cms/package.json light-cms/package-lock.json light-cms/tests e2e-light-cms playwright.light-cms.config.ts
git commit -m "test: cover Baogia SSO and remove Access artifacts"
```

---

### Task 9: Run Repository-Wide Quality, Migration, Parity, and Accessibility Gates

**Files:**
- Update evidence only after commands pass: `docs/free-light-cms/SECURITY_REVIEW.md`
- Update evidence only after commands pass: `docs/free-light-cms/MIGRATION_REPORT.md`
- Update evidence only after commands pass: `docs/free-light-cms/PROVIDER_PARITY_REPORT.md`
- Update evidence only after commands pass: `docs/free-light-cms/SESSION_RESUME_AUDIT.md`

**Interfaces:**
- Consumes: completed local implementation.
- Produces: exact local evidence and a deployment-ready commit.

- [ ] **Step 1: Run root and both application gates**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm --prefix quote-app run lint
npm --prefix quote-app run typecheck
npm --prefix quote-app test
npm --prefix quote-app run build
npm --prefix light-cms run lint
npm --prefix light-cms run typecheck
npm --prefix light-cms test
npm --prefix light-cms run build:production
```

Expected: all pass without exclusions, skips, lowered strictness, or deleted tests.

- [ ] **Step 2: Run real-local storage, migration, idempotency, and provider parity**

Run:

```bash
npm --prefix light-cms run d1:local
npm --prefix light-cms run runtime:local-smoke
npm exec --prefix light-cms -- tsx scripts/analyze-source.ts
npm exec --prefix light-cms -- tsx scripts/migrate-to-light-cms.ts
npm exec --prefix light-cms -- tsx scripts/migrate-to-light-cms.ts
npm exec --prefix light-cms -- tsx scripts/verify-light-cms.ts
npm test -- --run tests/cms-provider.test.ts tests/light-cms-provider.test.ts
```

Expected: the second dry run produces the same manifest/checksums and no remote writes; source analysis verifies current record/settings/media counts. Compare the result with the historical 12 content, 5 settings, and 10 media baseline, but report the current verified numbers if they differ.

- [ ] **Step 3: Run Playwright and Axe at all required widths**

Run:

```bash
npm run test:e2e:light
npm run test:e2e:cms
```

Expected: `e2e-light-cms/ui-accessibility.spec.ts` exercises 1440, 1024, 768, and 390 pixels with zero serious, critical, and color-contrast Axe findings on login, denied, dashboard, lists, editors, media, users, dialogs, and mobile navigation.

- [ ] **Step 4: Run security and repository hygiene scans**

Run:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' '(BEGIN (RSA|EC|PRIVATE)|CMS_SSO_PRIVATE_JWK\s*[:=]\s*["'"'][^"'"']+|SESSION_SECRET\s*[:=]\s*["'"'][^"'"']+)' .
git diff --check
git status --short
```

Expected: no private key or live secret; only intended files are dirty.

- [ ] **Step 5: Update reports and commit verified local acceptance**

Record exact command counts and failures rather than historical assumptions.

```bash
git add docs/free-light-cms
git commit -m "docs: record local Baogia SSO acceptance"
```

---

### Task 10: Audit Cloudflare, Configure Keys, and Deploy Backward-Compatible SSO

**Files:**
- Create locally outside the repository: an ES256 private/public JWK pair.
- Update remote secret: Baogia Worker `CMS_SSO_PRIVATE_JWK`.
- Update remote secret: Light CMS Worker `SESSION_SECRET` if absent.
- Update remote secret/variable: Light CMS `BAOGIA_SSO_PUBLIC_JWK`.
- Update evidence: `docs/free-light-cms/STAGING_DEPLOYMENT_REPORT.md`.

**Interfaces:**
- Consumes: Cloudflare credentials already present on the machine and the locally accepted builds.
- Produces: backward-compatible Baogia SSO endpoint and a testable custom-domain Light CMS deployment while the existing Access applications remain unchanged.

- [ ] **Step 1: Read-only audit current production and Cloudflare state**

Check website/Decap/fallback HTTP status, `CMS_PROVIDER`, Baogia deployment list, CMS Worker/Pages deployments, D1/R2 names, Access applications, plan/billing visibility, and DNS records. Save current deployment IDs and Access JSON before any mutation.

Expected: website provider and CMS production remain Decap, Workers Paid is not enabled, no paid subscription exists, and production DNS unrelated to `cms.mdftungphat.com` is unchanged. If any is false, stop all mutation and document the blocker.

- [ ] **Step 2: Generate a dedicated P-256 keypair outside the repository**

Use Web Crypto to generate an extractable keypair, write the private JWK only to a mode-700 temporary directory, and derive the public JWK from the same key. Verify `git status --short` does not show either file.

- [ ] **Step 3: Configure secrets without displaying them**

Pipe the private JWK to `wrangler secret put CMS_SSO_PRIVATE_JWK --config quote-app/wrangler.worker.jsonc`. Pipe a fresh 32-byte CMS session secret to `wrangler secret put SESSION_SECRET --config light-cms/wrangler.worker.production.jsonc`. Configure the public JWK for Light CMS without storing it in a committed file. Do not touch billing.

- [ ] **Step 4: Deploy Baogia and verify backward compatibility**

Deploy the quote Worker, then verify health, login, authenticated dashboard/quote reads, and the SSO endpoint. Do not apply Baogia D1 migrations and do not write quote/PDF test data.

- [ ] **Step 5: Apply only CMS migration 0003, deploy the CMS Worker, and switch the Pages code to direct custom-domain serving**

Apply migration `0003_baogia_sso.sql` to `tungphat-light-cms-production`, deploy `tungphat-light-cms-api-production`, then deploy the tested Pages build that removes the custom-domain redirect. Keep the existing Access applications unchanged during this checkpoint; they continue protecting only the Pages hostnames already recorded by the audit. Preserve the immediately previous Pages deployment ID for one-command rollback.

- [ ] **Step 6: Verify real custom-domain SSO before removing Access**

Reuse the existing signed-in Baogia ADMIN session in the browser. Confirm `cms.mdftungphat.com` stays canonical, starts SSO, receives the assertion, creates a CMS session, loads the dashboard, rejects replay, strips forged headers, and performs no Baogia D1/R2 write. If this fails, roll Pages back to the deployment recorded in Step 5 and stop.

- [ ] **Step 7: Update deployment evidence**

Record deployment IDs, resource IDs, secret names only, plan/cost, HTTP results, and the zero-Baogia-data-mutation evidence. Never record secret values.

---

### Task 11: Remove Cloudflare Access and Cut Over the CMS Custom Domain

**Files:**
- Remote Cloudflare Access applications/policies protecting Light CMS only.
- Remote Pages deployment for `tungphat-light-cms-production`.
- Existing DNS record for `cms.mdftungphat.com` only if attachment verification requires no value change.
- Update: `docs/free-light-cms/STAGING_DEPLOYMENT_REPORT.md`
- Update: `docs/free-light-cms/STAGING_ROLLBACK_RUNBOOK.md`

**Interfaces:**
- Consumes: real preview SSO acceptance from Task 10 and saved Access configuration.
- Produces: canonical `cms.mdftungphat.com` with Baogia SSO and no Cloudflare Access challenge/redirect.

- [ ] **Step 1: Reconfirm the last safe checkpoint**

Verify the Baogia deployment, CMS Worker, preview Pages build, SSO login, CMS logout, employee denial, and saved Access configuration. Confirm no billing page or paid action is pending.

- [ ] **Step 2: Reconfirm the canonical Pages entry**

Confirm the deployment from Task 10 serves the custom domain directly, redirects the production Pages hostname toward the custom domain, and has an active Pages custom-domain attachment. Do not remove Access until this check passes again.

- [ ] **Step 3: Remove only the Light CMS Access applications/policies**

Delete the Access application/policy IDs previously identified for Light CMS admin and its public bypass companion. Do not touch other Access applications, Zero Trust organization settings, identity providers, payment settings, website DNS, or Baogia.

- [ ] **Step 4: Verify URL retention and absence of Access**

Open `https://cms.mdftungphat.com/#/` and a deep CMS route. The address bar remains on `cms.mdftungphat.com` except for the temporary Baogia SSO navigation. Direct `https://tungphat-light-cms-production.pages.dev/` returns 308 to the custom domain. No `/cdn-cgi/access/login` or Access JWT appears.

- [ ] **Step 5: Record rollback commands and evidence**

The rollback target is the last tested SSO Worker/Pages deployment. Do not automatically recreate Access. Include deployment IDs and exact verification steps in the runbook.

---

### Task 12: Run Real Cloudflare Acceptance and Finalize Reports

**Files:**
- Modify: `docs/free-light-cms/IMPLEMENTATION_REPORT.md`
- Modify: `docs/free-light-cms/SECURITY_REVIEW.md`
- Modify: `docs/free-light-cms/BENCHMARK_REPORT.md`
- Modify: `docs/free-light-cms/STAGING_DEPLOYMENT_REPORT.md`
- Modify: `docs/free-light-cms/SESSION_RESUME_AUDIT.md`
- Modify benchmark outputs under: `light-cms/output/benchmark/`
- Modify acceptance outputs under: `light-cms/output/acceptance/`

**Interfaces:**
- Consumes: canonical custom-domain deployment with Baogia SSO.
- Produces: final evidence and either `LIGHT CMS STAGING ACCEPTANCE PASSED` or an exact blocker.

- [ ] **Step 1: Run the required real workload**

Reuse one authenticated Baogia/CMS session. Run at least 300 authenticated API/navigation requests, 200 public API requests, 50 CMS session checks, 50 draft saves, 20 publish/unpublish cycles, 20 version restores, and 20 media operations. Do not generate repeated Baogia logins or mutate quote data.

- [ ] **Step 2: Capture Worker evidence**

Record CPU p50/p95/p99/max, wall time, D1 reads/writes, ES256 cold/warm verify, assertion uses, session checks, gateway results, 1102 count, and 5xx count from real Worker observability. Require p99 at most 8 ms, max at most 9 ms, zero 1102, and zero 5xx.

- [ ] **Step 3: Run real E2E, security, accessibility, migration, and parity**

Run the canonical-domain SSO browser flow, CMS feature suite, security suite, Axe suite at four widths, migration verification, idempotency, and Decap/Payload/Light provider parity. Recheck current 12/5/10 migration counts rather than assuming them.

- [ ] **Step 4: Re-audit production safety and cost**

Confirm website production HTTP status, Decap CMS/fallback, `CMS_PROVIDER=decap`, Payload preservation, Workers Paid not enabled, no additional subscription, current monthly cost, no billing mutation, and no production DNS mutation outside the authorized CMS hostname behavior.

- [ ] **Step 5: Update all final reports with exact results**

The report includes:

```text
Auth strategy: Baogia internal ES256 SSO
Identity provider: Tùng Phát Baogia accounts (ADMIN only)
Cloudflare Access plan: NOT USED FOR LIGHT CMS
Current monthly cost: exact value returned by the account billing read
Payment mutation: NONE

CPU p50: exact measured duration in milliseconds
CPU p95: exact measured duration in milliseconds
CPU p99: exact measured duration in milliseconds
CPU max: exact measured duration in milliseconds

1102: exact observed count
5xx: exact observed count

E2E: exact passed/total count
Security: exact passed/total count
Accessibility: exact passed/total count
Migration: exact verified content/settings/media counts
Provider parity: exact passed/total count

Workers Paid activation: CANCELLED
Additional paid subscription: NONE
CMS production: DECAP
Website production provider: DECAP
Payload data preserved: YES
Production billing mutation: NONE
Production DNS mutation: NONE
```

Replace every evidence description with the measured value before finalizing; if evidence is unavailable, state the exact blocker instead of claiming acceptance.

- [ ] **Step 6: Run final verification and commit reports**

Run:

```bash
git diff --check
git status --short
```

Then stage only implementation, tests, generated non-secret evidence, and reports:

```bash
git commit -m "feat: deploy Light CMS with Baogia SSO"
```

Expected: conclude only `LIGHT CMS STAGING ACCEPTANCE PASSED` when every gate is proven; otherwise conclude `LIGHT CMS STAGING BLOCKED` with the exact failed gate.

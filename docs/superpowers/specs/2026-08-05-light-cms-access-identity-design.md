# Light CMS Cloudflare Access identity design

## Decision

Light CMS staging uses Cloudflare Access as the only identity provider. The Worker treats `Cf-Access-Jwt-Assertion` as authentication only after verifying its RS256 signature, issuer, application audience, time claims, and subject/email claims. D1 remains the source of truth for authorization and disables access immediately when a user is disabled.

Cloudflare Zero Trust onboarding currently reaches a `$0/month` checkout that requires an existing card and explicit authorization for overage charges. The checkout is not activated. This blocks the real Access application and real-session staging acceptance, but does not block local integration, signed-fixture tests, bundle isolation, or rollback preparation.

## Runtime flow

1. Cloudflare Access authenticates the user before the protected Pages/Worker route.
2. Pages forwards the verified Access JWT through the service binding, strips unverified identity convenience headers, preserves status/body, and never retries.
3. The Worker verifies the Access JWT against the team JWKS endpoint with an isolate-level TTL cache and one forced refresh for an unknown `kid`.
4. The Worker normalizes the email and loads a D1 user by Access subject or email.
5. A pre-provisioned user with a null subject is bound to the first verified Access subject only when email matches and no collision exists.
6. Every admin request rechecks D1 status and role. No D1 authentication session is created.
7. Mutation requests require the exact staging Origin and a stateless CSRF token derived from the verified Access JWT and the application secret.

## JWT verification

Only `RS256` is accepted. Verification rejects missing or malformed tokens, invalid signatures, wrong issuer, wrong audience, expired tokens, future `nbf`, unreasonable future `iat`, tokens older than the configured maximum lifetime, missing subject/email, unknown keys after refresh, and JWKS failures. JWKS keys are cached for a bounded TTL, imported once per cache entry, refreshed on unknown `kid`, and never used fail-open.

The verifier returns cache status and fetch counters for staging benchmark headers. It never caches D1 identity or role data.

## D1 identity model

The existing users table is extended with `access_subject`, `display_name`, `status`, and `last_login_at`. Existing password hashes and lockout columns remain untouched for rollback, but the Access build never reads them. New Access-only users receive a deliberately malformed legacy credential marker that cannot pass the PBKDF2 verifier.

Identity binding rules are fail-closed:

- unknown email and subject: deny;
- disabled status: deny;
- subject matches but email differs: deny;
- email matches but a different subject is already bound: deny;
- subject and email resolve to different rows: deny;
- null subject plus matching pre-provisioned email: bind once and audit;
- login never creates a user or super-admin.

Only super-admin can create staged identity mappings, change roles, or disable users. Email and Access subject are immutable through the public admin API.

## Session, CSRF, and logout

There is no internal authentication session. The Access JWT authenticates; the D1 row authorizes. A stateless CSRF token is returned from `/api/auth/session` and recomputed from the Access JWT for mutations. This avoids D1 session reads/writes while retaining cross-site request protection for Access-cookie requests.

Logout records an audit event, clears client CSRF state, and sends the browser to `/cdn-cgi/access/logout`. Token replay within the Access session is an accepted property of Access; replay does not bypass expiry, origin/CSRF checks, or the per-request D1 disabled-user check.

## Legacy rollback

PBKDF2 and the old D1 session module remain in `src/worker/security/legacy/`. No staging Worker or SPA production entrypoint imports them. The password login route is removed from the Access router and the login form is replaced with one “Đăng nhập quản trị” action. Bundle and route scans must prove that PBKDF2 strings and password endpoints are absent from staging artifacts.

Rollback consists of reverting the identity-auth commit and redeploying the prior password-auth Worker; the retained D1 password columns and hashes make a data rollback unnecessary.

## Access policy target

When Zero Trust can be activated without billing authorization, create staging-only Access applications for the Pages admin hostname and Worker admin API hostname. Allow only explicit approved email addresses, prefer One-time PIN unless an existing IdP is present, use a 12-hour session, leave health and the separately routed public content API public, and never configure production hostnames or broad domain/everyone policies.

## Acceptance

Local acceptance requires JWT integration tests with a real RSA signing fixture, D1 identity/RBAC/CSRF/gateway tests, UI tests, build/typecheck/lint, migration/provider parity, secret scan, bundle scan, and `git diff --check`. Remote acceptance additionally requires an activated Free Access application, a real Access session test, and the full Worker CPU benchmark gate of zero 1102, zero 5xx, p99 at most 8 ms, and maximum at most 9 ms.

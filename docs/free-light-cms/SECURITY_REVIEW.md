# Light CMS Baogia SSO security review

- Review time: `2026-08-09 03:29 +07`
- Scope: Baogia assertion issuer, CMS ES256 verification, replay protection, CMS session/CSRF, D1 authorization, Pages gateway, SPA login/logout, generated bundles, and local browser coverage.
- Local verdict: `PASS`.
- Remote Cloudflare verdict: pending deployment and real acceptance.

## Findings summary

| Severity | Open local findings |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 1 |

The remaining informational item is deployment state: the accepted Cloudflare Access runtime is still live until the Baogia SSO deployment is verified on the canonical hostname. Access removal is not performed before that checkpoint.

## Authentication and assertion verification

- Baogia remains the credential authority; CMS never receives a Baogia password, password hash, session cookie, or Baogia `SESSION_SECRET`.
- Only an active, non-deleted Baogia `ADMIN` session may issue a CMS assertion. `EMPLOYEE` is denied and forced password-change users must complete the change first.
- Assertions use ES256 with a dedicated P-256 key and fixed `kid`, issuer, audience, callback, 30-second maximum lifetime, `jti`, `sub`, username, display name, and role.
- CMS accepts only three non-empty JWT segments, `alg=ES256`, `typ=JWT`, the configured `kid`, a 64-byte signature, exact issuer/audience, valid `iat`/`nbf`/`exp`, non-empty subject, and `role=ADMIN`.
- Verification uses Web Crypto with a real P-256 fixture. Missing, malformed, alternate-algorithm, invalid-signature, wrong-issuer, wrong-audience, expired, future-`nbf`, future-`iat`, excessive-lifetime, missing-subject, wrong-role, and wrong-`kid` assertions fail closed.
- The assertion `jti` is SHA-256 hashed and inserted once in D1. Replay fails on the unique key and is audited.

## CMS sessions, authorization, and gateway

- CMS issues its own host-only, HttpOnly, Secure, SameSite=Lax, fixed 30-minute session after assertion verification and replay consumption.
- Session verification requires the signed cookie, an unrevoked D1 session row, and an active local Baogia shadow identity.
- Mutations require exact `Origin=https://cms.mdftungphat.com` and a session-bound CSRF token.
- Private responses are `Cache-Control: no-store`; the public snapshot remains explicitly cacheable.
- The Pages gateway makes one service-binding request, strips browser-supplied `Cf-Access-*`, `X-Auth-Request-*`, `X-Baogia-*`, and internal identity headers, and preserves cookies, status, body, 1102, and 5xx responses without retry.
- CMS users are read-only projections of Baogia identities. CMS exposes no role mutation, user creation, or identity editing endpoint.
- CMS logout revokes only the CMS session. Full logout is an explicit second navigation to Baogia.

## Password and Access isolation

- Migration `0004_remove_password_runtime.sql` removes `password_hash` from the active users schema.
- The production Worker dry-run bundle and SPA scan contain no `Cf-Access-Jwt-Assertion`, Access audience/issuer, `/cdn-cgi/access`, `/api/auth/login`, `PBKDF2`, `password_hash`, or password-form labels.
- Required SSO callback, ES256 verification, CSRF, and session-revocation markers are present.
- Secret-scan matches are limited to test-only repeated strings, runtime PEM delimiter parsers, and generated P-256 test keys; no live private key or session secret is in the repository.

## Fresh local evidence

- Full Light CMS suite: `22 files`, `81/81`.
- Security-focused suite: `11 files`, `53/53`.
- Baogia suite: `12 files`, `42/42`.
- Root suite: `14 files`, `60/60`.
- Light CMS browser/Axe suite: `8/8`, including 1440, 1024, 768, and 390 widths with zero serious, critical, or color-contrast findings.
- Decap rollback CMS browser suite: `5/5`.
- Worker production dry-run: `626.61 KiB`, gzip `98.93 KiB`.
- Bundle scan: forbidden `0`, required SSO markers missing `0`.
- Local SSO benchmark errors: `0`; assertion replay rejected; D1 queries `314`.
- `git diff --check`: pass.

Remote security acceptance, canonical-domain SSO, Cloudflare CPU evidence, and Access removal remain gated on Tasks 10-12.

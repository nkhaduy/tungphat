# Light CMS Access security review

- Review time: `2026-08-09 00:38 +07`
- Scope: Worker identity middleware, Pages gateways, D1 identity/RBAC model, SPA login/logout, generated bundles, Access configuration, public bypass routes, and live staging/production verification.
- Verdict: `PASS`

## Findings summary

| Severity | Open findings |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 2 |

- Root and Light CMS dependency audits report `0 vulnerabilities`.
- The secret scan found no credential or private-key material. Its only matches are expected PEM delimiter parser regexes in existing Google/GitHub integrations.
- The generated SPA/Worker scan found no `PBKDF2`, `/api/auth/login`, password field, or legacy password session marker.

## JWT and JWKS verification

- Missing, malformed, alternate-algorithm, invalid-signature, wrong-issuer, wrong-audience, expired, future-`nbf`, invalid-`iat`, excessive-age, missing-subject/email, and unknown-`kid` tokens fail closed.
- Only `RS256` is allowed. Real signed RSA fixtures exercise Web Crypto signature verification rather than decode-only mocks.
- The issuer is `https://broken-river-6fe3.cloudflareaccess.com`.
- The production audience is `425f831d635f338ccd1ae478e177399fad5e572170c08c52955fa19ec8706d51`; the staging audience remains isolated in its separate configuration.
- JWKS caching is isolate-local with bounded TTL, imported-key reuse, concurrent fetch deduplication, unknown-`kid` refresh, and refresh cooldown.
- A live staging 50-request probe recorded `50/50` cache hits and one observed JWKS fetch in the active isolate.

## Identity and RBAC

- D1 is the authorization source of truth on each private request; role/status data is not cached.
- Unknown, disabled, subject-colliding, and email-mismatched identities are denied.
- Login does not auto-create or auto-promote a super-admin. The production user was explicitly provisioned and linked to a verified Access subject.
- `access_subject` is unique, email is normalized/case-insensitive, and public mutations cannot change identity fields.
- Editors cannot publish, restore, delete content, change settings, delete media, read audit logs, or manage users.
- Admins cannot elevate themselves or another user to super-admin; only a super-admin can manage roles/status.
- Login, denied identity, subject binding, logout, role/status changes, and content actions are audited.

The live production D1 audit confirms one active approved super-admin. The migration actor remains disabled, has no Access subject, and uses the non-secret marker `!access-only!`.

## Access applications and policy

- Production application: `Tung Phat Light CMS Production` (`704abf69-5b27-4a09-85ce-4ed7dea94a86`).
- Protected destination: `tungphat-light-cms-production.pages.dev`.
- Policy: one exact approved email, no `Allow everyone`, 12-hour session.
- Public bypass application: `58092738-c486-4537-b589-343b51573d63`.
- Bypass destinations are limited to contact, quote, analytics, public API, and legacy video paths on `cms.mdftungphat.com`.
- The custom admin root does not bypass Access; it redirects to the protected Pages origin with `no-store`.

## Session, CSRF, gateway, and cache

- Access mode creates no internal password session and stores no bearer token in localStorage.
- Mutations require the configured Origin and an HMAC-derived CSRF token bound to the verified Access assertion.
- Cross-origin mutations, malformed CSRF, and forged `Cf-Access-*` convenience headers are rejected.
- The Pages gateway strips untrusted identity convenience headers and forwards the assertion through one service-binding request.
- The gateway does not retry, change upstream status, hide 1102, or cache private responses.
- Private responses are `Cache-Control: no-store`; the public snapshot alone is explicitly cacheable.
- Direct Worker access without a valid signed assertion returns `401`.
- Logout clears the SPA's in-memory CSRF value and returns the Cloudflare Access logout URL.

## Media and public-route integrity

- Metadata size/type/alt validation remains server-side.
- Uploads validate declared size, actual bytes, magic bytes, and stream length before R2 finalize.
- The Worker uses platform `FixedLengthStream` for real browser uploads.
- Public form probes accept only the website Origin and reject invalid input with `400`.
- Legacy video range forwarding preserves `206`, `Content-Range`, immutable caching, and cross-origin media headers.

## Test evidence

- Full Light CMS suite: `20 files`, `79/79`.
- Security-focused suite: `12 files`, `61/61`.
- JWT/JWKS suite: `16/16`.
- Light CMS Axe/UI: `6/6`, with 0 serious, 0 critical, and 0 color-contrast violations at 1440, 1024, 768, and 390 widths.
- Website Playwright: `17/17`.
- Decap rollback CMS Playwright: `5/5`.
- Access bundle scan, production Worker dry-run, dependency audits, secret scan, and `git diff --check`: pass.
- Authenticated production browser verification reached dashboard, content sections, settings, users, and audit as the approved super-admin.

## Informational notes

1. The accepted identity flow uses the Cloudflare account identity method available to this account; the application policy still restricts authorization to one exact approved email.
2. Legacy password modules remain isolated for local rollback/debugging only and are absent from deployed request bundles and route tables.

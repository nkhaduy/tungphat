# Light CMS Baogia SSO and UI design

## Decision

`cms.mdftungphat.com` serves Light CMS directly and never redirects users to a `pages.dev` hostname. Cloudflare Access is removed from the CMS authentication path. Authentication is delegated to the existing Baogia application at `baogia.mdftungphat.com` through a small internal SSO protocol, while authorization and CMS sessions remain owned by Light CMS.

Baogia remains the only source of account credentials. Only active, non-deleted Baogia users with role `ADMIN` may enter Light CMS. Employees are denied. Light CMS copies the established Baogia visual system and layout closely, replacing only the navigation, data, forms, and actions required by CMS features.

## Domain behavior

- `https://cms.mdftungphat.com` is the canonical CMS origin and is attached directly to the Pages project.
- The existing custom-domain-to-`pages.dev` redirect in `light-cms/functions/index.ts` is removed.
- Requests made directly to the Pages hostname redirect toward `https://cms.mdftungphat.com`; the canonical custom domain never redirects in the opposite direction.
- A temporary navigation to `baogia.mdftungphat.com` is allowed only while authenticating. Successful SSO always returns the browser to the CMS custom domain.
- The public website, `CMS_PROVIDER=decap`, Decap CMS, Payload data, production DNS unrelated to the CMS hostname, and all paid Cloudflare plans remain unchanged.

## SSO architecture

Baogia is the identity authority. Light CMS is an SSO client. Passwords, password hashes, Baogia cookies, and the Baogia session secret are never copied to Light CMS.

1. An unauthenticated CMS request starts SSO and stores a random state value in a short-lived, host-only, `HttpOnly`, `Secure`, `SameSite=Lax` CMS cookie.
2. The browser navigates to the Baogia SSO authorization route with a fixed client identifier, exact allowlisted callback URL, and the state value.
3. If the browser has no Baogia session, Baogia sends it to the existing Baogia login page and safely resumes the SSO request after login.
4. Baogia reuses its normal session verification and requires an active, non-deleted `ADMIN` user. An `EMPLOYEE` or disabled user receives a generic access-denied result.
5. Baogia signs a short-lived ES256 assertion with a private key available only to the Baogia Worker. The assertion contains a version, issuer, audience, subject, username, display name, role, `iat`, `nbf`, `exp`, and random `jti`.
6. Baogia returns the assertion to the exact CMS callback using an auto-submitted POST form. This keeps the assertion out of the URL and browser history.
7. CMS verifies the state cookie, algorithm, signature, issuer, audience, timestamps, role, subject, and assertion structure. It atomically records the `jti` in the CMS D1 database so the assertion cannot be consumed twice.
8. CMS creates its own opaque session, stores only a hash in CMS D1, sets a host-only session cookie, and redirects to the CMS dashboard.

The ES256 public key is configured in Light CMS. The private key remains a Baogia secret. CMS therefore cannot mint Baogia identities. SSO keys are separate from existing Baogia session and password secrets.

## Account and authorization model

Light CMS maintains a minimal shadow identity keyed by the immutable Baogia user ID for audit attribution. It stores no password material. On successful SSO it may update only the local display name, username, and last-login timestamp.

Every active Baogia `ADMIN` receives the full CMS administrator capability set. There is no CMS password login, employee access, automatic privilege promotion, or local identity editing. The CMS Users screen is read-only and explains that accounts and account status are managed in Baogia, with a link to the Baogia user-management screen.

CMS content permissions continue to be enforced server-side. Session cookies are `HttpOnly`, `Secure`, host-only, and `SameSite=Lax`. Mutations additionally require an exact allowed Origin and CSRF token. Private API responses use `Cache-Control: no-store`.

CMS sessions last 30 minutes and can be renewed through SSO without another password prompt while the Baogia session remains valid. This bounds how long a removed or disabled Baogia administrator can retain an already-issued CMS session without adding writes to the Baogia database. CMS logout revokes only the CMS session. A separate full-logout action may also navigate through the existing Baogia logout flow.

## No Baogia data mutation

The SSO implementation does not create an SSO table, code record, session, audit record, or other data in the production Baogia D1 or R2 resources. One-time assertion replay protection is stored only in the Light CMS D1 database. Baogia performs its existing read-only session/user lookup and signs the assertion in memory.

The only Baogia deployment changes are the SSO authorization endpoint, safe post-login return handling, signing-key configuration, and tests. Existing quote, user, password, PDF, branch, and settings behavior is preserved.

## Legacy authentication removal

The Cloudflare Access middleware, Access JWT configuration, Access login action, and Access logout flow are removed from active CMS entrypoints after SSO acceptance. The password login endpoint and password form remain absent. PBKDF2 modules may remain in a clearly isolated local-only legacy directory for forensic rollback, but no deployed CMS bundle imports them.

Bundle and route scans must show that the CMS deployment contains no password endpoint, password form, PBKDF2 request path, `Cf-Access-Jwt-Assertion` dependency, or client-injectable identity shortcut.

## Admin UI

The live Baogia application and its source at commit `69012c2` are the design reference. Light CMS reuses or faithfully ports:

- the Tùng Phát horizontal logo and workshop login imagery;
- Montserrat typography, forest-green primary color, orange focus/action accents, white sidebar, pale page canvas, thin borders, and restrained shadows;
- the approximately 250-pixel desktop sidebar, active navigation treatment, compact top bar, role badge, and logout placement;
- KPI cards, dense data tables, filters, status badges, action buttons, form fields, dialogs, empty states, error states, and mobile sidebar behavior;
- the square, operational visual character of Baogia rather than a generic SaaS dashboard style.

CMS navigation is Tổng quan, Sản phẩm, Bài viết, Dự án, Trang, Media, Cài đặt, Người dùng, Phiên bản, and Nhật ký. Editors preserve all existing draft, preview, publish, unpublish, restore, SEO, media, settings, and audit behavior. The Baogia login page is the actual credential-entry screen during SSO; CMS shows a matching branded error/retry screen only when SSO cannot complete.

## Gateway and public API

The Pages gateway remains same-origin for CMS admin traffic. It forwards cookies, request bodies, upstream status, and response bodies without retries or status masking. It strips forged identity and internal SSO headers from browser requests, never caches private responses, and preserves 1102 and 5xx evidence.

The published content API remains independent of the admin session and does not start SSO. Website provider parity for `decap`, `payload`, and `light` remains in scope, while the production website provider remains `decap`.

## Failure handling

- Missing or expired Baogia session: show the existing Baogia login and resume SSO afterward.
- Active employee or unauthorized account: show a generic Vietnamese no-access page without revealing other users or roles.
- Invalid state, signature, issuer, audience, timestamps, role, callback, or replayed `jti`: fail closed, clear transient CMS auth state, record a sanitized CMS audit event, and offer a safe restart.
- Disabled/deleted account encountered on renewal: revoke the CMS session and return to the no-access state.
- Baogia temporarily unavailable: preserve the current CMS session until its fixed expiry; new sessions fail closed with a retry screen and no credential fallback.
- Direct Pages hostname access: redirect only toward the canonical CMS custom domain.

## Deployment order and rollback

1. Add and test Baogia SSO support without changing its existing login or quote behavior.
2. Deploy the backward-compatible Baogia change and configure the dedicated signing secret without billing changes.
3. Deploy the Light CMS Worker, snapshot the existing Access and redirect configuration, then deploy the Pages build that serves SSO directly on `cms.mdftungphat.com`. The Access applications remain temporarily unchanged and continue protecting only their existing Pages hostnames.
4. Verify the real custom-domain session, gateway, RBAC, UI, and cryptographic flow. If it fails, roll Pages back immediately to the saved deployment before changing Access.
5. Remove the CMS Access applications/policies, then run full custom-domain acceptance including Baogia regression tests and CMS security, E2E, accessibility, provider parity, migration, and CPU gates.
6. Recheck that `cms.mdftungphat.com` stays canonical and that the public website remains Decap.

Before the custom-domain switch, rollback restores the previous CMS deployment without changing Access. After Access removal, rollback restores the last tested SSO deployment rather than re-enabling Access automatically; the saved Access configuration is audit evidence only. Reverting the Baogia deployment remains possible and requires no Baogia data rollback because the SSO feature creates no Baogia D1/R2 records.

## Verification and acceptance

Tests cover ES256 signing with a real fixture, missing/malformed assertions, wrong algorithm, signature, issuer, audience, callback, state, role, `iat`, `nbf`, expiry, duplicate `jti`, employee denial, disabled-user denial, safe return URLs, CSRF, Origin enforcement, session renewal, CMS-only logout, full logout, private caching, forged headers, and canonical-host behavior.

E2E covers logged-out CMS to Baogia login to CMS dashboard, already-authenticated Baogia to automatic CMS entry, employee denial, mobile login/denied states, CMS navigation, all existing CMS feature workflows, and Baogia login/quote regression. Accessibility retains zero serious, critical, and color-contrast violations at 1440, 1024, 768, and 390 pixels.

The real Cloudflare benchmark covers SSO cold/warm verification, CMS session checks, gateway, D1 lookups, dashboard, content, draft, publish/unpublish, restore, media, preview, and public API. Acceptance still requires zero 1102, zero 5xx, p99 CPU at most 8 ms, maximum CPU at most 9 ms, no paid plan activation, no billing mutation, and no production website/provider cutover.

# Light CMS Access staging deployment report

- Report update: `2026-08-09 00:38 +07`
- Verdict: `LIGHT CMS STAGING ACCEPTANCE PASSED`

## Cloudflare account and plan

- Account ID: `b9ae472cee29c5729ee90ccbb3533f33`.
- Workers subscription: `Workers Free`, active.
- Access subscription: `Zero Trust Teams Free Base`, active.
- Existing account service: `R2 Paid`, active from before this cutover.
- Current observed monthly/invoiced cost: `$0.00`; the billing page reports no invoices.
- Payment method: no additional payment method on file.
- Additional subscription created by this work: none.
- Payment/billing mutation by this work: none.

## Accepted staging resources

| Resource | Value |
|---|---|
| Pages project | `tungphat-light-cms-20260805-0855-staging` |
| Pages deployment | `853041a9-b7d3-466e-b578-096ca5c4fa0b` |
| Worker | `tungphat-light-cms-api-20260805-0855-staging` |
| Worker version | `7c0cb022-6fcb-41dc-b027-aff64c2a21e3` |
| D1 | `tungphat-light-cms-20260805-0855-staging` |
| R2 | `tungphat-light-media-20260805-0855-staging` |
| Access application | `2c39c2a3-46e4-4dd0-80b6-d482c3f4ee85` |

The staging application remains protected by one exact approved identity, with no broad allow policy.

## Staging acceptance evidence

- Missing direct-Worker JWT: `401`.
- Forged identity convenience header: did not replace the JWT-verified identity.
- Session, dashboard, content, versions, restore, preview, media metadata, R2 upload/delete, and public snapshot flows: pass.
- Worker tail: 1055 successful outcomes, no exception, no 1102, no 5xx.
- CPU p50/p95/p99/max: `2 / 3 / 5 / 8 ms`.
- JWKS warm probe: `50/50` hits; one observed isolate fetch.
- Staging data after cleanup: 12 active content, 8 published, 5 settings, 9 ready media.

## Authorized production CMS deployment

The user later explicitly requested deployment at `https://cms.mdftungphat.com/#/`. That instruction authorized the CMS hostname/CNAME cutover while leaving the public website provider unchanged.

| Resource | Value |
|---|---|
| Custom CMS entry | `https://cms.mdftungphat.com/#/` |
| Pages project | `tungphat-light-cms-production` |
| Pages deployment | `4433ca8c-4553-4b04-abf5-a22cbb96a586` |
| Worker | `tungphat-light-cms-api-production` |
| Worker version | `58b856bb-27d5-4045-9416-4311d1a94396` |
| D1 | `tungphat-light-cms-production` |
| R2 | `tungphat-light-media-production` |
| Production Access app | `704abf69-5b27-4a09-85ce-4ed7dea94a86` |
| Public bypass app | `58092738-c486-4537-b589-343b51573d63` |

The production Access application protects `tungphat-light-cms-production.pages.dev` with one exact approved identity and a 12-hour session. The custom hostname redirects to that protected origin. Public contact, quote, analytics, public API, and legacy video routes remain available through narrowly scoped bypass destinations.

## DNS and live runtime

- All three authoritative Tenten nameservers return `cms.mdftungphat.com CNAME tungphat-light-cms-production.pages.dev`.
- Cloudflare Pages lists `cms.mdftungphat.com` on the production project and reports it active with SSL.
- Custom root: `302` to the protected Pages origin.
- Pages root without a session: `302` to Cloudflare Access.
- Authenticated browser: production dashboard and all primary admin sections load as the approved `super-admin`.
- Public snapshot: `200`.
- Contact/quote/analytics validation probes: expected `400`.
- Legacy video byte range: `206`.

## Website and rollback safety

- Website production `https://mdftungphat.com`: `200`.
- Website source provider default remains `decap`; no website provider deployment was performed.
- Immutable Decap rollback `https://d9e520d2.tungphat-cms.pages.dev`: `200`.
- Payload D1/R2 resources and data remain present and untouched.
- No Workers Paid activation, new subscription, payment method, invoice, or billing confirmation occurred.

```text
Workers Paid activation: CANCELLED
Additional paid subscription: NONE
CMS production admin: LIGHT CMS
Website production provider: DECAP
Decap rollback preserved: YES
Payload data preserved: YES
Production billing mutation: NONE
Production DNS mutation: AUTHORIZED CMS CNAME ONLY
```

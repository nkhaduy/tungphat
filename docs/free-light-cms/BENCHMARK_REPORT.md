# Light CMS Access benchmark report

- Report update: `2026-08-09 00:38 +07`
- Benchmarked Worker: `tungphat-light-cms-api-20260805-0855-staging`
- Benchmarked Worker version: `7c0cb022-6fcb-41dc-b027-aff64c2a21e3`
- Verdict: `PASS`

## Acceptance gate

```text
0 errors 1102
0 request 5xx
p99 CPU <= 8 ms
max CPU <= 9 ms
```

| Metric | Result | Gate |
|---|---:|---:|
| CPU p50 | `2 ms` | informational |
| CPU p95 | `3 ms` | informational |
| CPU p99 | `5 ms` | `<= 8 ms` |
| CPU max | `8 ms` | `<= 9 ms` |
| 1102 | `0` | `0` |
| 5xx | `0` | `0` |
| Worker outcomes | `1055/1055 ok` | no errors |

The CPU values are Cloudflare Worker tail `cpuTime` measurements from the deployed Access staging build, not local wall-time estimates.

## Real staging workload

The authenticated workload reused one valid Access browser session and did not send repeated OTPs or persist JWT/cookie values.

| Route/workload | Observed Worker requests |
|---|---:|
| Auth/session | 354 |
| Dashboard | 202 |
| Content list | 53 |
| Content detail/update/delete | 122 |
| Public snapshot | 203 |
| Version list | 1 |
| Version restore | 20 |
| Media metadata | 40 |
| Media upload | 20 |
| Media delete | 40 |
| Total | 1055 |

Mutation coverage included 50 draft saves, 20 publish/unpublish state changes, 20 restores, 20 metadata-only media flows, 20 real R2 upload flows, and benchmark-fixture cleanup.

The required minimums were met: more than 300 authenticated/navigation requests, 200 public requests, 50 session checks, 50 draft saves, 20 publish/unpublish changes, 20 restores, and 20 media operations.

## Status and wall time

- HTTP statuses: `1014 x 200`, `41 x 201`.
- Worker exceptions: `0`.
- Wall p50/p95/p99/max: `177 / 1222 / 2651 / 16580 ms`.

Wall time includes browser, Access, Pages gateway, network, D1/R2, and deliberate concurrent load. It is not the Workers Free CPU gate.

## JWKS and D1 evidence

- Live warm-cache probe: `50/50` requests reported `X-Access-JWKS-Cache: hit`.
- Maximum live isolate JWKS fetch counter: `1`.
- The 50-session probe reported 150 D1 query operations in aggregate.
- Representative query counts: session `3`, dashboard `6`, content list `2`, public snapshot `3`.
- Private responses were `no-store`; the public snapshot was `public, max-age=60, stale-while-revalidate=300`.
- The post-run staging D1 audit read 1064 rows, wrote 0 rows, and confirmed the cleaned baseline.

Cloudflare tail does not expose exact per-request D1 row reads/writes. Query-operation headers and the read-only D1 audit are retained as the available D1 evidence.

## Current production data probe

A fresh read-only query against `tungphat-light-cms-production` reports:

```text
Active content: 12
Published content: 8
Settings: 5
Ready media: 9
Active approved users: 1
Rows written by probe: 0
```

The public snapshot independently returns `200` with the same 8 published records, 5 settings, and 9 media.

## Historical blocker resolution

PBKDF2 at 25,000 iterations previously recorded `p99 = 13 ms` and `max = 13 ms`, exceeding Workers Free. PBKDF2 is no longer on the staging or production request path. Access JWT verification plus D1 authorization passes the CPU gate without reducing signature, issuer, audience, time, CSRF, or RBAC checks.

## Production deployment note

The production Worker currently deployed is `tungphat-light-cms-api-production`, version `58b856bb-27d5-4045-9416-4311d1a94396`. The final custom-domain change is a Pages-only redirect to the Access-protected production Pages origin.

The 1055-request benchmark was not rerun after that redirect-only deployment. The accepted staging metrics remain the formal CPU gate evidence, and this report does not relabel them as a fresh production benchmark.

Machine-readable acceptance summary: `light-cms/output/benchmark/remote-access-acceptance.json`.

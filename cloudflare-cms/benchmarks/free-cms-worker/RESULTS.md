# Workers Free lightweight CMS benchmark

- Run date: `2026-08-04`
- Account: `b9ae472cee29c5729ee90ccbb3533f33`
- Plan: Workers Free (`10 ms` CPU per request shown in the dashboard)
- Worker: `tungphat-light-cms-benchmark`
- Worker version after secret creation: `71ef8c52-3ea8-4246-bfa8-10f7aba2b214`
- D1: `tungphat-light-cms-benchmark` (`a433800e-dfaa-4ae8-b584-b2afc7ebfb87`)
- R2: `tungphat-light-cms-benchmark`
- Custom domain/routes: none; shadow `workers.dev` only

## Scope

The Worker implements the hot paths required by the proposed CMS: health, signed-token verification, a D1-backed session check, content list/detail, optimistic D1 update, and streamed R2 HEAD/GET/PUT. It has no SSR, framework runtime, ORM, N+1 queries or production bindings.

## Results

- Functional warm run: `80/80` correct HTTP responses.
- Tail-confirmed run: `24/24` correct HTTP responses.
- Tail events captured after connection readiness: `21`, all outcome `ok`.
- Aggregate CPU: p50 `0 ms`, p95 `1 ms`, p99 `1 ms`, max `1 ms`.
- Route CPU max: session `1 ms`; content list `1 ms`; content detail `0 ms`; content update `1 ms`; R2 HEAD `1 ms`; R2 GET `0 ms`; R2 PUT `1 ms`.
- `exceededCpu`: `0`.
- Worker `1102`: `0`.
- Startup: `4 ms`.
- Billing after benchmark: dashboard total cost `$0.00`, projected cost `$0.00`, billable R2 usage `0`.

## Interpretation

The measured prototype has at least a 9 ms margin below the Workers Free per-request CPU ceiling. This validates the architecture candidate, not a future implementation automatically. Production eligibility still requires the complete implementation to repeat the same profile with at least 1,000 requests per route, cold-start samples, security tests, provider parity, and automatic Decap rollback.

The benchmark resources are intentionally isolated and retained. No Payload, Decap, lead, quote, website or production DNS resource was changed.

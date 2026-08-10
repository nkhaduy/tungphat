# Phase 10 Indexation And Authority Conversion Design

## Objective

Confirm indexation and search performance through authenticated Google or Microsoft data when available, convert existing high-confidence citations into canonical links through legitimate owner or publisher channels, and measure whether Bing exact-domain visibility propagates into real brand/local/long-tail visibility without adding indexable pages.

## Chosen Approach

Use a frozen-site, evidence-first pipeline:

1. Start from the newest valid `origin/main` in an isolated worktree and preserve unrelated concurrent work.
2. Check browser, API, email, social, and business-channel authentication once. Store capability states only; never expose credentials.
3. Keep authenticated indexation and performance fields `null` when ownership data is unavailable. Public search observations remain separate and never become confirmed indexation.
4. Recheck Thanh Thuy exactly once, verify every known citation/link state, and transmit corrections or editorial notes only through an authenticated legitimate sender.
5. Reuse the exact Phase 9 brand/local/long-tail and 40-query methodologies. Do not adjust queries to manufacture wins.
6. Run production regression, security, and performance maintenance checks. Change public code only for a verified regression or entity correction.
7. Persist deterministic Phase 10 JSON evidence and a final handoff. Skip deployment and IndexNow when canonical public output is unchanged.

## Evidence Model

- Authenticated states: `CONFIRMED_INDEXED`, `DISCOVERED_NOT_INDEXED`, `CRAWLED_NOT_INDEXED`, or `UNKNOWN` only when the owning platform exposes them.
- Public search states: observed result, position, engine, timestamp, and limitation; never indexation confirmation.
- Authority states: `LIVE`, `LOST`, `CHANGED`, `UNLINKED`, `PENDING`, `ACCEPTED`, `REJECTED`, or exact auth/channel blocker.
- External edges retain their typed classes: `platformIdentity`, `localPlace`, `socialIdentity`, `businessCitation`, `supplierManufacturer`, `editorialCitation`, and `referringDomain`.
- A referring domain counts once only when an independent live page exposes a verified canonical link to `https://mdftungphat.com/` or another canonical first-party URL.

## Deliverables

- Auth capability matrix and authenticated indexation/search-performance reports.
- Phase 10 authority pipeline, referring-domain history, NAP consistency, external actions, and entity graph v8.
- Exact-domain, brand/local/long-tail, unchanged 40-query benchmark, search-presence ladder v4, and AI retrieval/citation observations.
- Production crawl, sitemap/robots/schema/link/catalogue/security checks, three-run mobile Lighthouse maintenance baseline, and Phase 10 result/handoff.

## Failure Handling

- Missing connected browser or API credentials: record `AUTH_BLOCKED` once and continue public evidence work.
- Zalo application running without an available controlled authenticated channel: record channel unavailable; do not infer login or send.
- CAPTCHA, 2FA, owner verification, OAuth approval, payment, or legal attestation: stop only that external mutation and preserve the exact blocker.
- Publisher/search response unavailable: use `UNKNOWN` or retain the previous state; never infer rejection, removal, or non-indexation.
- JavaScript-only surfaces: use `UNVERIFIABLE_JS`, not `LOST`.

## Acceptance

Phase 10 may pass when every controllable measurement, verification, and legitimate conversion path is completed even if authenticated ownership remains unavailable and the 40-query benchmark stays at zero. It is partial when unavailable account ownership/contact channels prevent most meaningful conversion. No new indexable page, generic blog, catalogue URL, unsupported `sameAs`, vanity deployment, or broad IndexNow submission is permitted.

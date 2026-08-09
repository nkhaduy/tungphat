# Phase 7 Indexation And Authority Activation Design

## Objective

Determine whether Google, Bing, local platforms, and independent sources know and corroborate Tùng Phát, then improve the strongest controllable authority signals without increasing the indexable URL count.

## Chosen Approach

Use an evidence-first activation pipeline:

1. Attempt authenticated ownership through the available browser and configured APIs.
2. Record exact auth or owner-verification blockers without treating them as platform failures.
3. Collect public fallback evidence for all 54 canonical URLs, both Google Maps place IDs, legal-entity citations, social candidates, supplier references, backlinks, brand searches, local searches, and priority long tails.
4. Strengthen only the existing material reference asset and existing monitoring/reporting tooling.
5. Update entity and schema edges only where external identity is verified.
6. Deploy only if the public site changes, then run the unchanged 40-query benchmark once against final production.

This is preferred over a report-only approach because durable machine-readable evidence and a citation-ready asset remain useful after Phase 7. It is preferred over broad on-site content expansion because the Phase 6 evidence shows technical/content coverage is not the primary bottleneck.

## Evidence Model

Every source record contains a URL or explicit platform surface, observation time, evidence text, confidence, and a state from the approved vocabulary. Public search absence is `NOT_OBSERVED`, never `CONFIRMED_NOT_INDEXED`. Authenticated ownership failure is `AUTH_BLOCKED`; owner verification challenges use `BLOCKED_OWNER_VERIFICATION`.

Google Maps records are verified from the public embed payloads already linked by the first-party website. Facebook remains unverified unless the candidate aligns on multiple public signals and ownership can be established. Manufacturer or supplier relationships are recorded only when the manufacturer publishes an explicit distributor, dealer, or partner reference.

## Components

- `reports/gsc-baseline.json`: truthful GSC metrics and inspection baseline, including `null` when unavailable.
- `reports/indexation-status.json`: 54 canonical URL status matrix combining auth and public evidence.
- `data/local-entity-branches.json`: branch place IDs, names, NAP, category, status, and evidence.
- `data/external-authority-baseline.json`: verified referring domains, business citations, unlinked mentions, and supplier references.
- `docs/external-authority-outreach-pack.md`: verified facts, citation contexts, safe templates, and prohibited claims.
- `reports/phase7-authority-opportunities.json`: no more than 20 scored, legitimate opportunities.
- `reports/entity-graph-v5.json`: evidence-backed external edges and unresolved states.
- `reports/phase7-search-benchmark.json`: unchanged 40-query methodology after final deployment.
- `reports/phase7-result.json`: complete final handoff data.

## Public Site Change

The only planned public content change is a concise methodology and citation guidance section on `/tham-chieu-vat-lieu/`, plus equivalent methodology metadata in its existing JSON download. The change explains included data, source hierarchy, unknown handling, verification date, and the boundary between manufacturer facts and Tùng Phát recommendations. It adds no indexable route, fabricated statistic, inventory promise, relationship claim, third-party widget, or unverified `sameAs` URL.

The CNC checklist is changed only if inspection proves it lacks an evidence-safe print/download/anchor feature. Otherwise it remains untouched.

## Failure Handling

- Missing Browser session: record `AUTH_BLOCKED_BROWSER_UNAVAILABLE` and continue API/public work.
- Missing GSC/Bing credentials: record `AUTH_BLOCKED_CREDENTIALS_UNAVAILABLE`; metrics remain `null`.
- CAPTCHA, 2FA, OAuth owner confirmation, or business verification: record the exact allowed blocker and stop only that mutation.
- Search response unavailable: use `UNKNOWN`, not negative indexation evidence.
- JavaScript-only social surface: use `UNVERIFIABLE_JS`, not `REMOVED`.
- External claim cannot be proven: keep `UNVERIFIED` and exclude it from schema and verified counts.

## Testing And Acceptance

New status-mapping and methodology behaviors use test-first Vitest coverage. The final gate runs lint, typecheck, all app tests, CMS tests, build, E2E, SEO/schema/link/catalogue/provenance checks, production crawl, bot access, security and vulnerability checks, plus three mobile Lighthouse runs. A skipped command is reported as skipped, never passed.

Phase 7 is `PARTIAL` when the independent evidence and authority work completes but authenticated GSC/GBP/Bing ownership remains unavailable. Rankings are not required for acceptance, and Level 1 indexation is not described as an AI SEO win.

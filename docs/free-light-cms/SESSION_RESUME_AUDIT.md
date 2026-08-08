# Light CMS session resume audit

- Audit time: `2026-08-09 03:29 +07`
- Worktree: `/Users/khaduy/Downloads/tungphat-light-cms-worktree`
- Branch: `codex/light-cms-staging`
- HEAD before local-acceptance commit: `d2f3338`
- Worktree type: linked worktree; the repository root was not switched, reset, cleaned, or stashed.

## Dirty files at audit checkpoint

Intended source/config/evidence changes:

- `eslint.config.mjs`
- `tsconfig.json`
- `light-cms/scripts/build-migration-sql.ts`
- `light-cms/tests/migration.test.ts`
- `light-cms/output/acceptance/local-playwright.json`
- `light-cms/output/benchmark/local-sso-benchmark.json`
- `light-cms/output/migration/analysis.json`
- `light-cms/output/migration/migration.sql`
- `docs/free-light-cms/*.md` updated by this acceptance run

Excluded/unrelated generated files remain unstaged: `.DS_Store`, `public/.DS_Store`, `light-cms/dist/`, and local Wrangler state.

## Implementation classification

```text
F. Một phương án khác đã được triển khai thay Cloudflare Access:
Baogia internal ES256 SSO is implemented and locally accepted, but not yet deployed.
```

The earlier Cloudflare Access implementation had reached staging/production acceptance, but the owner explicitly rejected Access for the final CMS. The replacement implementation is now complete locally through plan Task 9.

## Desired authentication strategy

```text
Existing Baogia ADMIN session
  -> 30-second ES256 assertion
  -> Light CMS callback
  -> D1 one-time jti consumption
  -> independent 30-minute CMS session
  -> server-side authorization and CSRF
```

- Identity authority: Tùng Phát Báo Giá.
- Allowed identity: active, non-deleted `ADMIN` only.
- Denied identity: `EMPLOYEE`, disabled/deleted users, forced-password-change users until completion, malformed assertions, replay, and unknown subjects.
- CMS user management: read-only projection with a link back to Báo Giá.
- Password authentication in CMS: absent from UI, routes, runtime schema, and production bundle.

## Current deployed runtime before cutover

The remote CMS still uses the previously accepted Cloudflare Access deployment. It remains in place as the rollback-safe runtime until real Baogia SSO succeeds on `https://cms.mdftungphat.com/#/`.

- Production Pages project: `tungphat-light-cms-production`.
- Last recorded Pages deployment: `4433ca8c-4553-4b04-abf5-a22cbb96a586`.
- Production Worker: `tungphat-light-cms-api-production`.
- Last recorded Worker version: `58b856bb-27d5-4045-9416-4311d1a94396`.
- Production D1: `tungphat-light-cms-production` (`c46b5fa3-6db7-4de4-b797-99fc07158506`).
- Production R2: `tungphat-light-media-production`.
- Access application IDs remain recorded as `704abf69-5b27-4a09-85ce-4ed7dea94a86` and `58092738-c486-4537-b589-343b51573d63` until the pre-removal checkpoint passes.

These identifiers are historical evidence and must be refreshed read-only before mutation.

## Fresh local verification

- Root lint/typecheck/build/link validation: pass.
- Root tests: `60/60`.
- Baogia lint/typecheck/build: pass.
- Baogia tests: `42/42`.
- Light CMS lint/typecheck/production build: pass.
- Light CMS tests: `81/81`.
- Security-focused tests: `53/53`.
- Provider parity: `5/5`.
- Light CMS browser/Axe: `8/8`, with zero serious, critical, and color-contrast findings at 1440, 1024, 768, and 390 widths.
- Decap rollback CMS browser: `5/5`.
- Local D1/R2/JWT smoke: pass with 12 content, 5 settings, 9 media, 12 initial versions, and 2 idempotent runs.
- Migration SQL/media manifest repeated checksums: pass.
- Worker production dry-run: pass, upload `626.61 KiB`, gzip `98.93 KiB`.
- Bundle scan: forbidden `0`, required markers missing `0`.
- Local SSO diagnostic: 0 errors, replay rejected, 314 D1 queries; it is wall time and not Cloudflare CPU acceptance.
- Secret scan and `git diff --check`: pass; matches are parser/test fixtures only.

## Remaining work

1. Re-audit website, Decap fallback, provider, billing/plan, DNS, Payload, Cloudflare deployments/resources, and Access configuration read-only.
2. Generate a P-256 keypair outside the repository and configure only remote secret names/values required by Báo Giá and Light CMS.
3. Deploy backward-compatible Báo Giá SSO, apply CMS migrations `0003` and `0004`, deploy Worker and Pages, and verify canonical-domain SSO before Access removal.
4. Remove only the two Light CMS Access applications after the safe checkpoint.
5. Run real Cloudflare E2E/security/parity/accessibility and CPU acceptance, then update final reports.

No Workers Paid activation, billing mutation, website provider cutover, unrelated DNS mutation, Decap/Payload deletion, or Báo Giá D1/R2 write is authorized.

# Light CMS worktree snapshot manifest

- Snapshot date: `2026-08-09`
- Worktree: `/Users/khaduy/Downloads/tungphat-light-cms-worktree`
- Branch: `codex/light-cms-staging`
- Pre-SSO implementation base: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Design commits added before this snapshot: `8d01cf6`, `13c9bc0`
- Baogia source provenance: repository object `69012c2:quote-app/`

## Included Light CMS implementation

- `light-cms/`: Worker, Pages gateway, React admin, D1 migrations, scripts, tests, staging/production configs, non-secret reports, and acceptance outputs.
- `docs/free-light-cms/`: audits, implementation/security/benchmark/migration/parity/deployment reports, and rollback runbook.
- `cloudflare-cms/benchmarks/`: preserved historical free-Worker calibration evidence.
- `e2e-light-cms/` and `playwright.light-cms.config.ts`: Light CMS browser and accessibility suites.
- `lib/cms-provider.ts`, `lib/content.ts`, `tests/cms-provider.test.ts`, and `tests/light-cms-provider.test.ts`: Decap/Payload/Light provider facade and parity coverage.
- `eslint.config.mjs`, `package.json`, `package-lock.json`, `playwright.config.ts`, and `playwright.cms.config.ts`: root integration required to lint, typecheck, test, and run Light CMS without exclusions.
- Existing design/plan documents under `docs/superpowers/` related to Light CMS.

## Baogia source restored for SSO work

`quote-app/` was absent from this worktree and was restored without switching branches using:

```bash
git restore --source=69012c2 -- quote-app
```

This subtree is the exact source matching the live Baogia design/authentication generation previously audited. SSO changes must preserve its quote, user, branch, settings, PDF, password, session, and audit behavior and must not add Baogia D1/R2 writes.

## Explicit exclusions

- `.DS_Store` and `public/.DS_Store`.
- `.superpowers/` visual-companion session data; ignored through local git exclude only.
- `node_modules/`, build output not intentionally recorded, `.wrangler/` local state, Playwright reports, and test results.
- Any live token, account credential, private key, session secret, OAuth secret, or Wrangler authentication state.
- Unrelated repository-root changes not named in the included implementation list.

## Safety state

- Repository root was not switched, reset, cleaned, or stashed.
- Production website provider remains Decap.
- This snapshot does not authorize billing, paid plans, website cutover, unrelated DNS mutation, or deletion of Decap/Payload/Baogia data.

# Cloudflare migration report — 2026-10-31

## Deletion readiness

**NOT READY TO DELETE VERCEL**

Production apex and www still route to Vercel. Tenten DNS/registrar access and a complete zone export are unavailable in this session. The current CMS does not demonstrate reliable operation within Workers Free's CPU budget, and the existing R2 bucket exceeds the 10 GB included allowance. No billing upgrade, destructive data migration, DNS change or Vercel deletion has been performed.

This is an implementation checkpoint with working Cloudflare preparation, not a completed production migration. Remaining operations must use the acceptance checklist below; a preview that loads is not deletion readiness.

## Architecture and service status

Original: Vercel static Next.js frontend → independent Cloudflare CMS/CDN gateway → Payload Worker → D1/R2. Registrar is GMO/Onamae IANA 49, DNS Tenten. Full findings and service inventory: [INFRA_AUDIT.md](INFRA_AUDIT.md).

Candidate: the same Next.js **15.5.28 static export** on existing Pages project **tungphat**, account **b9ae472cee29c5729ee90ccbb3533f33**, project subdomain **tungphat-i9i.pages.dev**. Only `/catalog/*` uses a read-only streaming Function. CMS and CDN retain their existing ownership and URLs. No public SSR adapter, Vercel optimizer or new paid product is required.

The older direct-upload project `tungphat-website` is not the active Git deployment target. Its stale/deactivated apex/www custom-domain registrations must be handled deliberately during cutover; do not attach a hostname to two Pages projects or point apex at arbitrary shared IPs.

Vercel hosting, apex/www records and the project's Git integration remain active until production passes. Local `deploy:site` now calls Cloudflare. `vercel.json`/`.vercelignore` are retained for the still-live origin; their final removal and parity-test migration are pending. Vercel Storage UI shows no connected store. Public runtime uses no Blob/KV/Postgres/Edge Config/Analytics/Speed Insights service. Next's internal `@vercel/og` is code, not a hosted account dependency.

Vercel project environment names were inspected without revealing values: `NEXT_PUBLIC_MEDIA_BASE_URL`, `INDEXNOW_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PROCESS_VIDEO_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_FORMS_API_BASE`. Existing Cloudflare production variables cover the optional public settings; CMS defaults are independent of Vercel. Runtime secret values remain in Cloudflare, not Git.

## Free plan and headroom

| Component | Verified capacity / usage | Assessment |
| --- | --- | --- |
| Pages static files | 7,308 files vs 20,000 Free limit | 63.5% file-count headroom; no public server runtime |
| Pages asset size | Assets under 25 MiB | Gate passes; original media remains on CDN |
| Pages Git builds | 500/month; 1 concurrent; 20-minute timeout | One deploy pipeline; path/branch filters reduce unnecessary builds; actual remote duration must be recorded |
| Workers requests | Account UI 2,799/100,000 on observed day | Snapshot only; shares quota with other applications, which were not modified |
| Workers CPU / memory | Free 10 ms / 128 MiB | CMS sample: 21/28 requests >10 ms, max 980 ms; intermittent HTTP errors. **Blocking reliability issue** |
| Worker bundle | CMS dry-run ~13,978 KiB uncompressed / 2,987 KiB gzip | Current official size limit is 64 MiB uncompressed; old 3 MiB compressed advice is obsolete. CPU remains the constraint |
| D1 | 21.6 MB; Free 500 MB/database, 5 GB/account, 5m reads/day, 100k writes/day | Size fits; workload projections still require sustained usage data |
| R2 Standard | 10,374,930,514 bytes / 11,223 objects before restoration | Above 10 GB included allowance; **$0 target not met**. Restoring missing media adds only 7,894 bytes |
| Images | Build-generated variants/direct CDN; no paid transformation | No Vercel optimizer or Cloudflare Images subscription introduced |

R2 free allowances are account-wide: 10 GB-month, 1m Class A and 10m Class B operations. The full media download backup consumes approximately 11.2k read operations, not additional R2 storage. Request projections are not guarantees; no historical monthly product-level billing export was available through the OAuth subscription endpoint (403). Cloudflare's UI confirmed Workers Free and $0 Workers billable usage at inspection; this does not establish R2's bill.

Official current references and decimal storage units are linked in the audit. No paid feature was enabled to pass a test. Reducing R2 must preserve referenced source/provenance assets and verified recovery; deleting originals or replacing Payload silently is not an acceptable workaround.

## Cleanup and measured sizes

See [ASSET_CLEANUP_REPORT.md](ASSET_CLEANUP_REPORT.md) for all classifications and exact actions. Removed five proven duplicates, retained their URLs, added two mobile WebPs, and restored one missing catalogue image from a byte-identical verified object.

| Full artifact | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Files | 7,311 | 7,308 | -3 |
| Total bytes | 602,553,673 | 601,345,305 | -1,208,368 |
| JS bytes | 1,246,919 | 1,247,830 | +911 |
| CSS bytes | 87,949 | 87,949 | 0 |

Source public assets: 107 → 104 files; 44,301,122 → 44,476,921 bytes. Original sources are retained; source storage rises 175,799 bytes while delivery shrinks. Do not present source growth as storage savings.

Mobile hero: PNG 1,385,310 bytes → WebP 86,294 bytes at 768px or 195,980 bytes at full width. Catalogue swatches were not re-encoded. Production dependency audit after patch updates: **0 vulnerabilities** (`npm audit --omit=dev --audit-level=high`). Dev/CMS dependency risk is separate from that public production dependency result.

## Functional, SEO and performance evidence

Baseline: all **2,652 sitemap URLs 200**, **2,836 unique asset URLs**, one pre-existing missing swatch now restored with matching SHA-256. Baseline visible text, metadata/canonical/robots/schema counts and media references are saved in ignored `reports/cloudflare-exit/`.

Local final `npm run verify` exited 0 after the source changes: public lint/types/tests, edge types, all supplier validation/tests, Payload integration/build/dry-run, static build, metadata/schema/catalogue/JS budgets, **239,672 internal links**, **2,652 valid sitemap URLs**. Regression results, remote Git build, preview deployment ID, full candidate comparison and Lighthouse follow-up are appended after they finish.

Proxy regression first failed against the fabricated image implementation; all four cases pass after replacement (actual bytes, range/status, missing-image 404, credential stripping/HEAD/write rejection). Mobile browser regression first failed on the production PNG; it checks modern-format selection and payload after the fix. Responsive `naturalWidth` is density-corrected, so it must not be interpreted as raw encoded pixels.

One baseline mobile Lighthouse lab run: **74**, LCP **11,234 ms**, FCP **1,087 ms**, TBT **12 ms**, CLS **0**, transferred **2,762,852 bytes**. Equivalent Cloudflare preview measurement is still required; local-vs-production differences must be labelled and cannot prove field improvement. No field INP/p75 improvement is claimed.

## Cloudflare-only deployment

Versioned source: `wrangler.jsonc`, `config/cloudflare-pages-project.json`, `public/_headers`, `public/_redirects`, `functions/catalog/[[path]].ts`, `scripts/prepare-cloudflare-artifact.mjs`. CI validates pull requests; existing Cloudflare Git integration is the only automatic deployment path.

Cloudflare Git build command:

```sh
npm ci
npm ci --prefix payload-cms
npm run verify
```

Build output `out`, Node 22, `SKIP_DEPENDENCY_INSTALL=1`. Approved production branch `main`; previews restricted to `codex/cloudflare-*`. Documentation/quote-app/agent-file changes are excluded from Cloudflare build watches. `_routes.json` prevents static traffic consuming Worker requests. Preview builds add noindex headers; production canonical metadata always uses `https://mdftungphat.com`.

Manual recovery/deployment (OAuth login or scoped Cloudflare API token required, never Vercel):

```sh
git clone https://github.com/nkhaduy/tungphat.git
cd tungphat
npm ci
npm ci --prefix payload-cms
npm run deploy:cloudflare:preview
# After verified release approval/process:
npm run deploy:cloudflare
```

The current user request authorizes this migration's commit/push/deployment; no force-push or history rewrite is used. Do not run supplier sync, migrations or media deletion as deployment tests.

## Cloudflare-only disaster recovery

The pre-migration code tag is `migration/pre-cloudflare-exit-20261031`; this tag alone does **not** contain the migration fixes. Select the final verified migration commit or a recorded successful Cloudflare deployment. Do not restore Vercel DNS as the permanent rollback.

D1 backup: ignored `backups/cloudflare-exit-20261031/d1.sql`, **17,353,860 bytes**, SHA-256 **a105ba471b887b847aab43780788ef06c0bdb6c4423f745f86492802a9a89572**. A local SQLite restore passed integrity check and has 97 tables. It contains private CMS data: keep it out of Git and access-controlled. Store an independently controlled additional backup copy before deleting any infrastructure.

Media backup: `backups/cloudflare-exit-20261031/media/` and `media-manifest.json`. Completion, total bytes and verification failures must be recorded before calling this a usable full backup. The missing swatch restored after inventory is also retained at `local-media/cloudflare-exit/p-2052-g-swatch.webp`; include it in the final backup manifest.

Public DNS snapshot: `reports/cloudflare-exit/dns-public-before.json`; registry snapshot: `rdap-before.json`. A **full** Tenten zone export is still missing. Never replace a zone using only the public snapshot. Before cutover, store the complete zone export in the controlled backup alongside the eventual Cloudflare zone ID, nameservers, records and redirect rule export.

Required public build variable names (values belong in Cloudflare configuration): `PAYLOAD_PUBLIC_URL`, `NEXT_PUBLIC_FORMS_API_BASE`, `NEXT_PUBLIC_ANALYTICS_API_BASE`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, optional `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PROCESS_VIDEO_URL`, `INDEXNOW_KEY`. Cloudflare build controls: `NODE_VERSION=22`, `SKIP_DEPENDENCY_INSTALL=1`.

Required CMS secret names: `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `IP_HASH_SALT`, `TURNSTILE_SECRET_KEY`. Existing values are not readable from the API inventory and have not been exported. Keep an independently controlled secure escrow; do not rotate PAYLOAD_SECRET casually. The Worker configuration also defines its public URL/site/media vars, D1 ID and R2 bucket.

Recovery sequence:

1. Clone GitHub and check out the last verified migration revision; install both lockfiles with npm ci. Configure public build inputs independently of Vercel.
2. If CMS/data remain healthy, run `npm run verify`, then `npx wrangler pages deploy out --project-name tungphat --branch main`; verify the returned immutable Cloudflare URL before changing production traffic.
3. To roll back a bad Pages release, select a recorded successful **production** Pages deployment and use Cloudflare's rollback action/API, or rebuild the recorded Git SHA and redeploy. The old pre-migration export omits new proxy fixes, so it is not an automatically safe fallback.
4. If CMS recovery is needed, provision a NEW Cloudflare D1 database and R2 bucket under an explicitly approved recovery action. Restore SQL to the new database and restore media from the hash-verified manifest. Update bindings in a recovery branch. Never import over or delete the existing production database/bucket without explicit authorization and a verified backup.
5. Restore CMS secret values from secure escrow, run `npm --prefix payload-cms run verify`, then its verified Worker/gateway deployment procedure. Recheck APIs, admin, Turnstile and CDN before frontend deployment.
6. Restore independently backed-up Cloudflare DNS/rules if the zone was lost, retaining email, DKIM/SPF/DMARC/TXT/CAA and other subdomains. Verify registrar delegation, TLS and all production hostnames. Vercel is not part of this recovery path.
7. Repeat sitemap/metadata/redirect/media/browser checks and record the new deployment ID and Git SHA. A successful local restore is not a production disaster-recovery drill.

## Remaining acceptance gates

See [VERCEL_DELETION_CHECKLIST.md](VERCEL_DELETION_CHECKLIST.md). Blocking work includes full DNS access/backup and supported apex cutover; exact Free budget/reliability remediation without losing media or CMS functionality; staging/production regression closure; Cloudflare-only release/rollback evidence and secure secret escrow. No Vercel disconnection/deletion is appropriate yet.

# Cloudflare migration report — 2026-10-31

## Deletion readiness

**NOT READY TO DELETE VERCEL**

Production apex and www still route to Vercel. Authenticated Tenten DNS access and a complete six-record backup are now available. This session does not expose registrar nameserver editing; no supported apex delegation/cutover has occurred. The current CMS does not demonstrate reliable operation within Workers Free's CPU budget, and the existing R2 bucket exceeds the 10 GB included allowance. No billing upgrade, destructive data migration, DNS change or Vercel deletion has been performed.

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

Local final `npm run verify` exited 0 after the source changes: public lint/types/tests, edge types, all supplier validation/tests, Payload integration/build/dry-run, static build, metadata/schema/catalogue/JS budgets, **239,672 internal links**, **2,652 valid sitemap URLs**. Remote Git build, preview ID, full candidate comparison and Lighthouse results are recorded below.

Proxy regression first failed against the fabricated image implementation; all four cases pass after replacement (actual bytes, range/status, missing-image 404, credential stripping/HEAD/write rejection). Mobile browser regression first failed on the production PNG; it checks modern-format selection and payload after the fix. Responsive `naturalWidth` is density-corrected, so it must not be interpreted as raw encoded pixels.

One baseline mobile Lighthouse lab run: **74**, LCP **11,234 ms**, FCP **1,087 ms**, TBT **12 ms**, CLS **0**, transferred **2,762,852 bytes**. Cloudflare preview lab results are recorded below; localhost timing is labelled separately and cannot prove field improvement. No field INP/p75 improvement is claimed.

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

Media backup: `backups/cloudflare-exit-20261031/media/` and `media-manifest.json`. All inventory objects were verified and totals are recorded below. The missing swatch restored after inventory is retained at `local-media/cloudflare-exit/p-2052-g-swatch.webp` and has been included in the final backup manifest.

Public DNS snapshot: `reports/cloudflare-exit/dns-public-before.json`; registry snapshot: `rdap-before.json`. The full authenticated six-record Tenten table is saved at `docs/evidence/tenten-zone-before.json` and in the controlled backup. This UI does not offer a native zone-export action or registrar nameserver controls. Never replace a zone using only public DNS guesses. Before cutover, store the complete zone export in the controlled backup alongside the eventual Cloudflare zone ID, nameservers, records and redirect rule export.

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

See [VERCEL_DELETION_CHECKLIST.md](VERCEL_DELETION_CHECKLIST.md). Blocking work includes registrar delegation control and supported apex cutover; exact Free budget/reliability remediation without losing media or CMS functionality; staging/production regression closure; Cloudflare-only release/rollback evidence and secure secret escrow. No Vercel disconnection/deletion is appropriate yet.

## Verified checkpoint results

- Source checkpoint: `d7eee5e` on `codex/cloudflare-exit`, pushed to GitHub. Configuration correction: `2385493`, also pushed. `main` remains `5b1b324`; no production promotion occurred.
- Independent Cloudflare Git build attempt `cfe58000-c138-44c2-aa89-67235d8d8ac8` cloned GitHub successfully but failed before dependencies: the Pages build validator rejects `account_id` in Wrangler. The correction removes it from Wrangler; the explicit account stays in `config/cloudflare-pages-project.json`. Retry `d496182d-e562-4a24-a43d-3aadc33b6f6a` succeeded after its clean build and verify gate.
- Final local verify: **139 public test files / 708 tests**, **44 supplier test files / 313 tests**, **9 CMS integration files / 28 tests**, all passed. Focused post-configuration tests: **10 passed**. Pages Function compilation passed. Root production dependency audit: **0 vulnerabilities**.
- Full browser suite against local Pages: **45 passed / 29 failed**. It is NOT a passing production regression result. Failures include inherited homepage taxonomy/navigation selectors, contrast/target-size findings, and obsolete same-origin API assumptions (static Pages returns 405 for those old requests). Analytics tests also expect a dedicated test-mode build. Three selected homepage content/taxonomy/accessibility failures reproduced on the unchanged Vercel production baseline. Not every failure has been classified; unresolved cases remain gates.
- Mobile hero regression: passed after the format change. All **33 concrete Pages redirect rules** passed local status/location checks. Actual local media proxy returned **7,894 bytes with the manifest SHA-256**; a missing media path returned **404**.
- Full local candidate crawl: **2,652/2,652 routes 200**. Titles, descriptions, canonical URLs, robots and schema counts matched baseline on every route. Five visible-text hashes differ: homepage, article listing and the three article detail pages. Their text comes from the current CMS article snapshot versus the frozen Vercel export; no catalogue or article copy was authored in this change. This was isolated to stale local generated fetch cache; the fresh Cloudflare Git build matches all baseline text, as documented below.
- Initial R2 backup: **11,223 objects / 10,374,930,514 bytes**, all size/ETag checks passed, **0 failures**. Including the restored missing swatch: **11,224 files / 10,374,938,408 bytes**. Backup manifest SHA-256: `290a7b597495920e931f4efc4b648fd517b57fd18eb46b4d71f35e1e7b2a9c51`. Full object list and per-object SHA-256 are in the ignored backup manifest. No remote object was deleted.
- Local mobile Lighthouse after optimization: score **90**, LCP **3,554 ms**, transfer **1,318,424 bytes**, CLS **0**. This is a localhost lab observation. Its score/timing cannot be treated as a controlled comparison with the production baseline; a remote Cloudflare run is required.
- Compressed public baseline is committed at `docs/evidence/cloudflare-baseline.json.gz` (187,285 bytes), SHA-256 `58dee5d4e942ee630db41cebe9c2f298384e19e746fbd27d742ae8ad3a12123e`. It includes all route signals, build totals and public DNS snapshot, without secrets. Decode with `gzip -dc docs/evidence/cloudflare-baseline.json.gz`.

The catalogue index still contains **2,910 verified codes**: Thanh Thuỳ 342, Ba Thanh 373, An Cường 2,195. Live CMS API counts observed during audit: 6 product documents, 3 articles, 0 project documents. Product families, colour records and searchable codes are distinct counts; do not equate them. Migration source changes do not modify supplier/catalogue records.

## Remote Cloudflare release verification

Cloudflare Git preview **d496182d-e562-4a24-a43d-3aadc33b6f6a**, commit **2385493387ab21b187bddd8762b82b79670a184a**, deployed successfully at **2026-10-31 14:47:48 UTC** (21:47 ICT). URL: **https://d496182d.tungphat-i9i.pages.dev/**. This was a clean GitHub checkout and Cloudflare build running the mandatory verify gate, independent of local `.next`, Vercel credentials, deployment history and artifacts.

Remote crawl: **2,652/2,652 URLs 200**, **zero differences** against baseline in titles, descriptions, canonical URLs, robots, structured-data count **and visible-text hashes**. This closes the earlier five local text differences for the released candidate. Local Next `force-cache` data was stale: the independently restored D1 article titles match both the fresh Git build and production baseline. Before a manual release from an existing checkout, clear only generated Next fetch cache (or use a clean checkout); do not seed releases from old output folders.

```sh
# In the canonical repository only; this removes generated fetch cache.
node -e 'require("node:fs").rmSync(".next/cache/fetch-cache", {recursive:true, force:true})'
npm run verify
```

Remote browser regression subset: **14/14 passed**, covering mobile hero, normalized exact-code search, aliases for Ba Thanh/Thanh Thuỳ, supplier counts, verified image, pagination, empty results, cards, desktop/tablet/mobile search placement, Ba Thanh material collections, no-JavaScript usefulness and mobile overflow. The wider historical suite's 29 failures remain recorded at `docs/evidence/cloudflare-browser-failures.json`; the focused pass does not replace its unresolved acceptance gates.

With every browser request to a Vercel hostname intercepted and aborted, eight representative preview routes returned 200 with exactly one H1; exact-code search navigated to the expected detail page. No Vercel request was attempted and no browser page error occurred. Contact page retained 5 phone links, 4 Zalo links and 5 map links; no phone call, Zalo message or live lead submission was sent. First simulation attempt pressed Enter before asynchronous results loaded; the corrected runner waits for the visible result, matching the passing journey test.

Preview HTTPS is valid, default missing page returns **404**, `/ma-mau/` returns **308**, and `X-Robots-Tag: noindex, nofollow, noarchive` is present. **31 new/changed first-party asset URLs** returned 200; unchanged CDN references reuse the full baseline availability check, with the missing swatch separately restored and verified. Desktop/mobile screenshots are `output/playwright/cloudflare-{desktop,mobile}.png`.

| Mobile Lighthouse, one lab run per host | Vercel baseline | Cloudflare preview |
| --- | ---: | ---: |
| Performance score | 74 | 94 |
| FCP | 1,087 ms | 1,442 ms |
| LCP | 11,234 ms | 2,554 ms |
| TBT | 12 ms | 0 ms |
| CLS | 0 | 0 |
| Transferred bytes | 2,762,852 | 1,230,618 |

Observed transfer falls **1,532,234 bytes (55.5%)**; FCP is 355 ms higher in the single Cloudflare run while still within the good lab threshold. Different networks/cache states and single samples prevent a statistical claim; no field CWV/INP gain is asserted. The image resource saving is independently measured. No meaningful JS/CSS payload regression was found (+911 JS bytes, unchanged CSS).

Authenticated Tenten backup now includes **all six configured records**, with no configured MX/SPF/DKIM/DMARC/CAA. Registrar remains independent of Vercel. `docs/evidence/cloudflare-zone-target-plan.json` records the **unapplied** Free zone target, exact preserved records, HTTPS and path/query-preserving www redirect. No nameserver, DNS record, zone redirect rule or production domain attachment was changed.

The CMS production dependency audit separately reports **25 findings (3 critical, 10 high, 11 moderate, 1 low)**. This is an existing CMS issue, distinct from the patched public app's zero production dependency findings. No untested CMS upgrade or billing change was pushed to its live Worker.

**Final status remains NOT READY TO DELETE VERCEL.** Static frontend independence is demonstrated on Cloudflare preview; the complete system's Free, production cutover, full regression and production rollback gates are not satisfied. Deleting Vercel now would break apex/www.

Vercel Git settings UI also confirms **no deploy hooks**. Its Git connection remains active intentionally until production cutover passes. No account/project deletion or integration disconnection has been performed.

Final live production check (before any DNS change): apex 200 on Vercel; www 308 preserves `/van-mdf/?audit=1`; CMS health 200; deliberately invalid contact POST rejects with 400 `validation_failed` and the correct production CORS origin, without creating a lead. The OPTIONS preflight returned **503**, so the real CMS/form reliability gate remains failed. These are pre-cutover observations, not post-cutover validation.

The media backup was also checked on disk: **11,224 distinct case-normalized paths**, **11,224 files**, exact size sum **10,374,938,408 bytes**, matching the hash manifest. Summary evidence is versioned at `docs/evidence/cloudflare-validation-summary.json`.

Production promotion is deliberately blocked by the user's acceptance gate: unresolved Free CPU/storage requirements, live preflight failure, historical browser failures, missing registrar delegation control and no verified Cloudflare production rollback/cutover. A supported Free architecture needs these constraints resolved while preserving all CMS and catalogue functions. No paid workaround was activated.

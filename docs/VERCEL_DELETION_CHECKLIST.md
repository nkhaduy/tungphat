# Vercel deletion checklist

> Current status - 2026-11-01: **NOT READY TO DELETE VERCEL**. CMS CPU, media storage and browser blockers below have been resolved and deployed; the remaining cutover blocker is registrar authority. The owner confirmed that another account controls nameservers and they cannot access it. Active apex/www DNS still points to Vercel. Earlier dated sections are historical baseline evidence, not the current blocker list. See [current implementation checkpoint](CLOUDFLARE_BLOCKERS_PROGRESS.md) and [current measured results](evidence/cloudflare-blocker-measurements.json).


**NOT READY TO DELETE VERCEL**

The owner must not delete project `lmskis/tungphat` yet. This checklist is the deletion gate, not authorization to delete automatically. Do not remove the entire team/account or anything belonging to KIS.

## Completed

- [x] Tag the original revision `migration/pre-cloudflare-exit-20261031`.
- [x] Verify registrar independently: GMO/Onamae, not Vercel; Tenten DNS.
- [x] Inventory live routes, CDN origin, D1/R2 bindings and public Vercel references.
- [x] Verify the Vercel project's Storage page shows no connected stores.
- [x] Replace the local site deploy command with Cloudflare deployment.
- [x] Repair the real catalogue proxy; remove the unsupported external Pages 200 rewrite.
- [x] Repair Cloudflare Git build configuration and remove its stale DB binding/Vercel CORS settings.
- [x] Preserve catalogue data and valid legacy URLs during local cleanup.
- [x] Export D1 and successfully restore it locally with `integrity_check=ok`.

## Required before deletion

- [x] Resolve CMS CPU and R2 storage blockers: production thin Worker0-1ms plus Free DO runtime, main media8.591GB; all100 moved originals match canonical CDN bytes.
- [x] Finish and verify complete R2 backup (11,224 files including restored swatch; no failures).
- [ ] Keep an additional independently controlled backup copy and escrow CMS secret values securely.
- [x] Obtain authenticated Tenten DNS access and back up the FULL displayed zone: 6/6 records, no configured email records.
- [ ] Obtain registrar nameserver editing access; the DNS-only session has no delegation control.
- [x] Create pending Cloudflare Free zone and mirror all6 original records DNS-onlyTTL600.
- [ ] Registrar holder changes nameservers after coordinated cutover preparation; owner confirms they do not control that account. Preserve mail/CMS/CDN/baogia. Handle any DNSSEC delegation deliberately.
- [ ] Attach apex/www to the chosen Pages project; verify active TLS, apex 200, www permanent redirect preserving path/query and HTTP→HTTPS.
- [x] Verify current GitHub clean build/CI and real preview browser74/74; all2,652 routes200 with identical baseline metadata/text/schema counts. Media checks are recorded in the current report.
- [ ] Cut over only after critical tests pass; then repeat full production crawl/browser/API tests and cross-check DNS, project domains, deployment revision and bindings.
- [ ] Verify Cloudflare-only rollback/redeploy, independent backups and required environment names/secret access.
- [ ] Remove `vercel.json`, `.vercelignore` and remaining tests coupled to those files only after their replacements have passed production verification.
- [ ] Disconnect only `lmskis/tungphat` from GitHub and remove its deploy hooks/integrations. Keep other repositories/projects/accounts intact.
- [ ] Confirm no active DNS, storage, optimizer, secret, API or media URL needs Vercel.
- [ ] Owner-only: delete the old Vercel project after the report explicitly changes to **READY TO DELETE VERCEL**. Domain registration is independent; no registrar transfer to leave Vercel is needed.
- [ ] Recheck production from a fresh browser/network immediately after deletion, using the Cloudflare-only recovery procedure if needed.

## Deletion simulation evidence

| Question | Current answer |
| --- | --- |
| Hosting disappears? | **FAIL**: current apex/www DNS still use Vercel. |
| Build history disappears? | **PASS for candidate**: clean GitHub clone, verify and deploy succeeded on Cloudflare preview, commit682f853, deployment1a89886e. |
| Image optimizer disappears? | Public images are unoptimized/direct. Catalogue proxy no longer fabricates images. |
| Vercel storage disappears? | No connected project stores; catalogue lives in Cloudflare D1/R2. |
| Vercel DNS disappears? | Authoritative DNS is Tenten, but apex/www records still target Vercel. |
| Vercel environment disappears? | **PASS for candidate**: Cloudflare built and deployed without Vercel credentials or artifacts. |
| Registrar independent? | **PASS**: registry RDAP reports GMO/Onamae IANA 49. |
| Recover without Vercel? | D1 local restore and complete media backup verified; secret escrow, a verified Cloudflare production release/rollback and DNS cutover remain required. |


Continuation checkpoint (2026-10-31): see [blocker progress](CLOUDFLARE_BLOCKERS_PROGRESS.md) and [measured evidence](evidence/cloudflare-blocker-measurements.json). Security patches and gateway fast paths are under staging validation. Production DNS and media originals remain unchanged. Readiness remains **NOT READY TO DELETE VERCEL**; the new staging candidate has not passed the complete acceptance gate.


## Current owner-only delegation action

Cloudflare zone4cc9a59d98651da1950571a2bf07252e is Free/pending. Six original records are mirrored; active Tenten DNS is untouched. The holder of the registrar account must eventually replace ns-a1/ns-a2/ns-a3.tenten.vn with **lia.ns.cloudflare.com** and **nero.ns.cloudflare.com**, coordinated with Pages hostname attachment and final CNAME changes. No registrar transfer or password disclosure is needed. The DNS-only account cannot perform this action. Until it is done and production cutover passes, Vercel remains required for apex/www.

- [x] Full browser74/74 and current engineering gate708+313+38 pass.
- [x] Real staged CMS browser/auth/editor/media workflows pass.
- [x] Production CMS/gateway deployed and D1 counts preserved.
- [x] Independent exact-byte media archive and guarded restore procedure tested for reads.
- [x] Current runtime revision682f853 clean GitHub build1a89886e and CI41287589823 verified; final custom-domain frontend release remains pending.
- [ ] Live apex/www on Cloudflare, full2652-route post-cutover crawl and Vercel-blocking proof.
- [ ] Only after these checks: detach obsolete Vercel Git integration/config and owner deletes old project.

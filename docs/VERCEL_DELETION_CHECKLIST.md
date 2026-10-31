# Vercel deletion checklist

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

- [ ] Resolve whole-system Free blockers: CMS exceeds the Free CPU budget on sampled requests and has intermittent HTTP 500/503; R2 payload is above 10 GB.
- [x] Finish and verify complete R2 backup (11,224 files including restored swatch; no failures).
- [ ] Keep an additional independently controlled backup copy and escrow CMS secret values securely.
- [x] Obtain authenticated Tenten DNS access and back up the FULL displayed zone: 6/6 records, no configured email records.
- [ ] Obtain registrar nameserver editing access; the DNS-only session has no delegation control.
- [ ] Add the domain to Cloudflare Free in the intended account, reproduce every record, then change nameservers through Tenten. Preserve mail and existing CMS/CDN/baogia records. Handle any DNSSEC delegation deliberately.
- [ ] Attach apex/www to the chosen Pages project; verify active TLS, apex 200, www permanent redirect preserving path/query and HTTP→HTTPS.
- [ ] Verify Cloudflare staging and GitHub clean build; compare all 2,652 valid sitemap routes, metadata, structured data, text and media to baseline.
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
| Build history disappears? | **PASS for candidate**: clean GitHub clone, verify and deploy succeeded on Cloudflare preview, commit 2385493. |
| Image optimizer disappears? | Public images are unoptimized/direct. Catalogue proxy no longer fabricates images. |
| Vercel storage disappears? | No connected project stores; catalogue lives in Cloudflare D1/R2. |
| Vercel DNS disappears? | Authoritative DNS is Tenten, but apex/www records still target Vercel. |
| Vercel environment disappears? | **PASS for candidate**: Cloudflare built and deployed without Vercel credentials or artifacts. |
| Registrar independent? | **PASS**: registry RDAP reports GMO/Onamae IANA 49. |
| Recover without Vercel? | D1 local restore and complete media backup verified; secret escrow, a verified Cloudflare production release/rollback and DNS cutover remain required. |

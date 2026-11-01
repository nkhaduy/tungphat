# Deployment

Current production apex/www still use Vercel while the Cloudflare exit gates remain blocked. Do not delete the Vercel project. The verified Cloudflare candidate runs at https://1a89886e.tungphat-i9i.pages.dev from GitHub commit 682f853. Follow [the migration report](CLOUDFLARE_MIGRATION_REPORT.md) and [deletion checklist](VERCEL_DELETION_CHECKLIST.md) for current evidence and blockers.

## Cloudflare deployment path

The default local site command is now `npm run deploy:site` → `npm run deploy:cloudflare`; it never invokes Vercel CLI. Both manual deploy commands run `npm run verify` first. Preview: `npm run deploy:cloudflare:preview`. Target is Pages project `tungphat` (`tungphat-i9i.pages.dev`), account `b9ae472cee29c5729ee90ccbb3533f33`.

Existing Cloudflare Git integration clones `nkhaduy/tungphat`, installs both npm lockfiles and runs `npm run verify` before deploying `out`. Only main is production; allowed preview branches match `codex/cloudflare-*`. PR CI validates separately and reuses its build artifact for browser tests. GitHub remains the code source; no Vercel credential, hook, CLI or build history is needed for the candidate.

For a manual release from an existing checkout, clear generated `.next/cache/fetch-cache` or use a clean checkout so old cached CMS content cannot enter a release. Do not use old `out` folders as source. Required variable names and exact recovery commands are in the migration report. Account ID is in `config/cloudflare-pages-project.json`; it must not be placed in the Pages Wrangler file because the Pages Git-build validator rejects that field.

## Existing CMS and media

Payload remains Worker `tungphat-payload-cms`, D1 `tungphat-payload-cms`, R2 `tung-phat-media`; gateway Pages project `tungphat-light-cms-production` serves cms/cdn hostnames. `npm run deploy:cms` runs the full root verification once, then uploads its already-built Worker and gateway. Node22.23.4 or compatible24.22.1+ is required. Do not downgrade Payload below3.90 after password hashes have been upgraded to600k iterations. No data migration, supplier synchronization or media deletion is part of a normal deploy.

CMS secrets: `IP_HASH_SALT`, `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `TURNSTILE_SECRET_KEY`. Keep values only in Cloudflare and independent secure escrow. Production CMS now uses the verified SQLite Durable Object workspace runtime with the same D1/R2. Outer Worker CPU measured0-1ms; DO cold/editor requests remain below its documented Free30s limit. R2 originals offloaded to exact-byte Pages archive; main bucket now8,590,643,653bytes/11,124objects. See current evidence in the migration report.

After a future authorized production cutover, verify apex/www/CDN/CMS HTTPS, all sitemap routes, metadata/redirects, catalogue images/search, service/contact actions and API behavior. Record DNS, Cloudflare deployment ID and source revision. Localhost or preview alone does not close the production gate.

## Verified recovery checkpoints

The secure CMS deployment is `7c72815f-65ae-43dd-87e1-cd8e0358e54b`; gateway `cb234e0b-1cb9-4c9c-b57c-57792056e21b`; static archive `1eb0a303`; frontend clean Git build `1a89886e-f122-4832-a7da-fbb7941e5565`. Rebuild the recorded Git SHA through the existing verified pipeline when a Pages production rollback is unavailable. An actual custom-domain production rollback remains a post-cutover gate.

To recover the exact-byte archive from the independently controlled media backup:

```sh
node scripts/prepare-media-archive.mjs /absolute/media-backup /absolute/isolated-archive-output
cd /absolute/isolated-archive-output
# Use the authenticated Wrangler executable from the canonical repository.
/Users/khaduy/tungphat/node_modules/.bin/wrangler pages deploy . --project-name tungphat-media-archive --branch main
cd /Users/khaduy/tungphat
node scripts/verify-media-archive.mjs
```

The isolated output includes its own static-only configuration; do not deploy it from the repository root where application Functions could be included. Prefer this archive redeploy to a full R2 copy restoration: restoring all100 originals adds1.784GB and would exceed current account storage capacity unless other storage changes. No such production restore was run as a test.

An isolated local R2 recovery drill restored one15,703,925-byte original with matching size/ETag/HTTP/custom metadata; duplicate PUT returned412 and disabled deletion403. This verifies the maintenance restore semantics locally, alongside the separate real staging R2 upload workflow. It is not a production data-loss drill. Maintenance listeners used during migration have been stopped.

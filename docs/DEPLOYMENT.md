# Deployment

Current production apex/www still use Vercel while the Cloudflare exit gates remain blocked. Do not delete the Vercel project. The verified Cloudflare candidate runs at https://d496182d.tungphat-i9i.pages.dev from GitHub commit 2385493. Follow [the migration report](CLOUDFLARE_MIGRATION_REPORT.md) and [deletion checklist](VERCEL_DELETION_CHECKLIST.md) for current evidence and blockers.

## Cloudflare deployment path

The default local site command is now `npm run deploy:site` → `npm run deploy:cloudflare`; it never invokes Vercel CLI. Both manual deploy commands run `npm run verify` first. Preview: `npm run deploy:cloudflare:preview`. Target is Pages project `tungphat` (`tungphat-i9i.pages.dev`), account `b9ae472cee29c5729ee90ccbb3533f33`.

Existing Cloudflare Git integration clones `nkhaduy/tungphat`, installs both npm lockfiles and runs `npm run verify` before deploying `out`. Only main is production; allowed preview branches match `codex/cloudflare-*`. PR CI validates separately and reuses its build artifact for browser tests. GitHub remains the code source; no Vercel credential, hook, CLI or build history is needed for the candidate.

For a manual release from an existing checkout, clear generated `.next/cache/fetch-cache` or use a clean checkout so old cached CMS content cannot enter a release. Do not use old `out` folders as source. Required variable names and exact recovery commands are in the migration report. Account ID is in `config/cloudflare-pages-project.json`; it must not be placed in the Pages Wrangler file because the Pages Git-build validator rejects that field.

## Existing CMS and media

Payload remains Worker `tungphat-payload-cms`, D1 `tungphat-payload-cms`, R2 `tung-phat-media`; gateway Pages project `tungphat-light-cms-production` serves cms/cdn hostnames. `npm run deploy:cms` runs the full root verification once, then uploads its already-built Worker and gateway. Node22.23.4 or compatible24.22.1+ is required. Do not downgrade Payload below3.90 after password hashes have been upgraded to600k iterations. No data migration, supplier synchronization or media deletion is part of a normal deploy.

CMS secrets: `IP_HASH_SALT`, `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `TURNSTILE_SECRET_KEY`. Keep values only in Cloudflare and independent secure escrow. Production CMS now uses the verified SQLite Durable Object workspace runtime with the same D1/R2. Outer Worker CPU measured0-1ms; DO cold/editor requests remain below its documented Free30s limit. R2 originals offloaded to exact-byte Pages archive; main bucket now8,590,643,653bytes/11,124objects. See current evidence in the migration report.

After a future authorized production cutover, verify apex/www/CDN/CMS HTTPS, all sitemap routes, metadata/redirects, catalogue images/search, service/contact actions and API behavior. Record DNS, Cloudflare deployment ID and source revision. Localhost or preview alone does not close the production gate.

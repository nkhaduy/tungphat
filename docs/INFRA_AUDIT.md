# Infrastructure audit — 2026-10-31

> Current status - 2026-11-01: **NOT READY TO DELETE VERCEL**. CMS CPU, media storage and browser blockers below have been resolved and deployed; the remaining cutover blocker is registrar authority. The owner confirmed that another account controls nameservers and they cannot access it. Active apex/www DNS still points to Vercel. Earlier dated sections are historical baseline evidence, not the current blocker list. See [current implementation checkpoint](CLOUDFLARE_BLOCKERS_PROGRESS.md) and [current measured results](evidence/cloudflare-blocker-measurements.json).


Status: migration in progress; production cutover is blocked. The pre-migration Git tag is `migration/pre-cloudflare-exit-20261031` (`5b1b324`). GitHub `nkhaduy/tungphat` and local main matched at audit start. The pre-existing Ba Thanh validation-report modification and untracked quote-app are outside this change.

## Verified original architecture

- Apex `mdftungphat.com`: A `216.198.79.1`. `www`: CNAME `d69b5815ccf0cf8d.vercel-dns-017.com`. DNS, Vercel project UI and live responses jointly confirm Vercel hosting. Project `lmskis/tungphat`, ID `prj_53zuxv2QpKkGB1QUzltzj5I7a4mO`; UI production revision was the Oct 21 homepage supplier-section removal, matching `5b1b324`.
- Public app: Next.js **15.5.21** initially, React resolved from npm lockfile, Tailwind 3.4, npm 10 / Node 22. Separate root and payload-cms npm lockfiles are intentional. Node requirement is `>=20.19 <27`. This migration patches public Next to **15.5.28**, Sharp to **0.35.5**, Zod to **4.6.7**, and source-map-js to **1.2.2**; Wrangler becomes **4.156.0**.
- `next.config.mjs`: `output: export`, trailing slash, unoptimized images. Dynamic path segments use generated static pages; no public SSR, ISR, server actions or application middleware. `knowledge.json` is generated at build time. Search/filtering uses client code and static supplier indexes. The public site needs no Next server or framework adapter.
- Existing `/catalog/*` Pages Function was returning an identical 1-pixel WebP for every URL. It is replaced by a bounded, streaming, read-only proxy to the actual CMS media path, preserving status/range/validators. Static requests bypass Functions via an explicit `_routes.json`.
- `cms` and `cdn`: CNAME `tungphat-light-cms-production.pages.dev`; gateway code forwards to `tungphat-payload-cms.nkhaduy.workers.dev`. CDN canonical media paths map to `/media/...`. Its root returns a legitimate 404; test actual media URLs, not the root as an availability signal.
- CMS: Payload **3.88.0**, Next **16.2.11**, OpenNext Cloudflare, Worker `tungphat-payload-cms`. Bindings verified through the account API: D1 `1f6f14d9-2798-4a6d-b892-231278bc7eaf` and R2 `tung-phat-media`. D1 is 21,639,168 bytes. Cloudflare secrets exist by name; values were not retrieved.
- `baogia` is a separate existing Cloudflare Pages application. No changes are made to it or any KIS resources.

## Vercel dependency inventory

| Service / reference | Evidence and disposition |
| --- | --- |
| Hosting / domains / CDN | Active apex and www still use Vercel. Must cut over and revalidate before deletion. |
| Git deployment integration | Active Vercel integration from GitHub. Leave connected until Cloudflare production passes; then disconnect only this project. |
| CLI deployment | `deploy:site` formerly invoked `vercel --prod`; replaced with Cloudflare-only command. Vercel CLI is not a package dependency. |
| vercel.json / .vercelignore | Retained while they still describe the live Vercel origin. Cloudflare uses `_headers`, `_redirects`, Functions and Wrangler instead. Remove after successful cutover and migrate remaining parity-test fixtures. |
| Image optimization | Public `images.unoptimized=true`; no Vercel optimizer needed. Baseline HTML contains no Vercel media/service URL. |
| Blob / KV / Postgres / Edge Config | No API/client, connection variable or runtime reference found. Vercel project's Storage UI shows no connected database/store. |
| Analytics / Speed Insights | No Vercel analytics packages or scripts. Existing Google Analytics and first-party CMS endpoints remain independent. |
| Edge Functions / serverless / cron | No public Next server functions, middleware, server actions or cron dependency. CMS APIs/background services already live on Cloudflare. |
| Environment / hooks | Public build inputs use CMS/CDN/Google/Turnstile/IndexNow. Vercel Git settings confirms no deploy hooks; no source deploy hook or runtime Vercel secret. UI inventory completed: NEXT_PUBLIC_MEDIA_BASE_URL, INDEXNOW_KEY, NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_PROCESS_VIDEO_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY, NEXT_PUBLIC_FORMS_API_BASE. Values were not revealed. |
| DNS / registrar | Tenten nameservers, GMO/Onamae registrar (IANA 49), verified in registry RDAP. Domain expiration 2027-04-15. Registration is independent of Vercel. |
| Transitive @vercel/og | Next internal package/tracing reference; bundled implementation, not a network/storage account dependency. Do not remove framework internals by vendor name. |
| vercel.app security exclusions, robots, historical docs | Non-operational references; not dependencies. Historical documents remain evidence. |

## DNS, HTTPS and email

Nameservers: `ns-a1.tenten.vn`, `ns-a2.tenten.vn`, `ns-a3.tenten.vn`. Cloudflare account `b9ae472cee29c5729ee90ccbb3533f33` currently has no `mdftungphat.com` zone. Wrangler OAuth has zone read, no DNS edit permission. The user subsequently supplied an authenticated Tenten DNS session. Its unfiltered table contains exactly 6/6 records; all are backed up in docs/evidence/tenten-zone-before.json, including authoritative TTL cross-checks. This DNS-only session does not expose registrar nameserver editing.

Public queries found no apex MX, SPF, CAA or _dmarc record; Google verification TXT is present. The authenticated full table also contains no MX/SPF/DKIM/DMARC/CAA record; all six configured records are captured. Preserve every record during any nameserver migration. Cloudflare Pages requires the apex to be an active zone in the same account; an apex A record pointed at generic Pages IPs is not a supported substitute. No production DNS has been changed.

## Baseline and evidence

Ignored local evidence: `reports/cloudflare-exit/`. Desktop/mobile screenshots: `output/playwright/before-{desktop,mobile}.png`.

- Sitemap: **2,652 URLs**, all **200**. Full route signals saved: canonical, title, description, robots, JSON-LD count, visible-text hash, image/script/style URLs and response status.
- **2,836** unique asset references checked; one pre-existing 404 at `catalog/ba-thanh/laminate/p-2052-g-swatch.webp`.
- Baseline static export: **7,311 files**, **602,553,673 bytes**, JS **1,246,919 bytes**, CSS **87,949 bytes**. These are complete artifact totals, not per-navigation transferred sizes.
- Baseline Lighthouse mobile, one lab run: performance **74**, FCP **1,087 ms**, LCP **11,234 ms**, TBT **12 ms**, CLS **0**, transfer **2,762,852 bytes**. No CrUX credential/data was available; this is not field INP or a p75 statement.
- Initial `npm run verify` completed successfully, including public/catalogue/CMS tests, build and full internal-link validation. New migration checks are separately recorded.

## Free-tier feasibility

Static Pages is suitable: 7.3k files against 20k, largest assets below 25 MiB, static requests do not consume Worker quota. No vinext/OpenNext is introduced for the public site.

Whole-system Free acceptance is **not established**. The existing CMS used **18–980 ms CPU** on representative live requests in tail evidence; 21 of 28 sampled events exceeded 10 ms. Some direct login probes returned 500, and an earlier probe series returned four 503 responses. Tail events in that sample were `ok`, so these HTTP failures are not all proven CPU-limit errors. Do not call the CMS reliable within the 10 ms Free budget merely because some requests succeed.

R2 inventory: **11,223 objects, 10,374,930,514 payload bytes**, above the 10,000,000,000-byte included storage allowance. At least one object is 30,337,989 bytes, above the Pages 25 MiB file limit. Supplier originals are referenced as provenance and must not be deleted to force a budget claim. No billing upgrade or remote deletion was performed.

Official references checked 2026-10-31: [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 decimal units](https://r2-calculator.cloudflare.com/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Pages apex requirements](https://developers.cloudflare.com/pages/configuration/custom-domains/), [external proxy restriction](https://developers.cloudflare.com/pages/configuration/redirects/).

Existing CMS browser evidence confirms Cloudflare **Error 1102**, Worker exceeded resource limits, at 2026-10-31 13:28:53 UTC, Ray ID a53301678ade6047. It is historical evidence from the same production Worker, not a claim that every current HTTP 500 has that cause.


Continuation checkpoint (2026-10-31): see [blocker progress](CLOUDFLARE_BLOCKERS_PROGRESS.md) and [measured evidence](evidence/cloudflare-blocker-measurements.json). Security patches and gateway fast paths are under staging validation. Production DNS and media originals remain unchanged. Readiness remains **NOT READY TO DELETE VERCEL**; the new staging candidate has not passed the complete acceptance gate.

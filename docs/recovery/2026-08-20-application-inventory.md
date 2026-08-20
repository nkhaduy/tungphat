# Application inventory - 2026-08-20

## Active production components

- Public site: root Next.js 15 static export, deployed by Vercel project `lmskis/tungphat` to `mdftungphat.com`.
- CMS/API: Payload 3.88 and Next.js 16 in `payload-cms/`, built with OpenNext and deployed as Worker `tungphat-payload-cms`.
- CMS hostname gateway: `payload-cms/gateway/_worker.js` on Pages project `tungphat-light-cms-production`; it is active infrastructure despite the legacy project name.
- Database: production D1 `tungphat-payload-cms` for Payload content, users, leads, analytics, reviews, and migration state.
- Media: production R2 `tung-phat-media`; Payload stores metadata/references and serves objects through CMS media routes.
- Frontend content snapshot: `scripts/sync-payload-build-data.mjs` fetches published Payload globals during production build.

## Supplier catalogue

An Cuong, Thanh Thuy, and Ba Thanh have separate discovery/crawl/normalize/validate modules under `scripts/`. Shared catalogue logic builds search and color-code indexes, audits media provenance, and can synchronize records to Payload. Validation/test/index generation is local. Commands containing crawl, download, `media:publish`, `full-sync --upload`, `sync:payload`, cleanup execution, or remote D1 execution can mutate local caches or production and are not ordinary tests.

## Integrations

- Forms, analytics, reviews, health, preview, and media APIs are served by Payload runtime endpoints.
- Turnstile uses a public site key in Vercel and a secret Worker key in Cloudflare.
- Optional Google Analytics and IndexNow are build/runtime integrations.
- Vercel rewrites public form and catalogue media paths to `cms.mdftungphat.com`; `www` redirects to the apex domain.
- GitHub Actions verifies both npm workspaces and uploads the root static export artifact.

## Legacy and retained code

The recovery commit removed the prior `cloudflare-cms/`, `workers/`, `content/`, and `e2e-cms/` implementations as part of the committed Payload cutover. Historical commits and tags preserve them. The Pages project itself is not dead: its current gateway is required because the CMS hostname cannot attach directly to the Worker in the current DNS/account arrangement. Old design and migration documents remain evidence and must not be treated as current operational commands when they conflict with `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.

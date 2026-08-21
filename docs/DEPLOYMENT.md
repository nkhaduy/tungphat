# Deployment

## Architecture

- Public static Next.js site: Vercel project `lmskis/tungphat`, production `https://mdftungphat.com`.
- Payload CMS: Cloudflare Worker `tungphat-payload-cms`, D1 `tungphat-payload-cms`, R2 `tung-phat-media`.
- CMS hostname: Cloudflare Pages project `tungphat-light-cms-production` forwards `https://cms.mdftungphat.com` to the Worker.

## Commands

`npm run verify` is the mandatory pre-deploy gate. `npm run deploy:site` verifies and deploys the linked Vercel project to production. `npm run deploy:cms` verifies Payload, performs an OpenNext Worker deploy, then deploys the Pages hostname gateway. Neither command migrates D1, synchronizes suppliers, or deletes R2 objects.

Normal website production is also deployed by Vercel Git Integration from `main`. Do not push `main` until the intended commit passes verification.

After every deploy verify `https://mdftungphat.com`, `https://www.mdftungphat.com`, `https://cms.mdftungphat.com`, `https://cms.mdftungphat.com/api/health`, representative catalogue/detail routes, forms/API behavior, and media responses.

Cloudflare Worker secrets are `IP_HASH_SALT`, `PAYLOAD_SECRET`, `PREVIEW_SECRET`, and `TURNSTILE_SECRET_KEY`. Store them only with Cloudflare secret management. Vercel variable names are documented in `.env.example`.

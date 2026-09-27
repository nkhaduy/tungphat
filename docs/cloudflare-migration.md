# Cloudflare Pages Migration

- **Date:** 2026-09-27
- **Before:** Vercel project `lmskis/tungphat` served `https://mdftungphat.com`.
- **Target:** Cloudflare Pages project `tungphat-website` (`MIGRATION_TARGET = PAGES`); the static Next.js export needs no server runtime.
- **Build:** Node 22, `npm ci`, `npm run build`, output `out`.
- **Deploy:** `npm run deploy:cloudflare:preview` or `npm run deploy:cloudflare` after `npm run verify`.
- **Production domain:** `mdftungphat.com`, with `www` permanently redirected to the apex.
- **Pages variables:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `NEXT_PUBLIC_PROCESS_VIDEO_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_FORMS_API_BASE`, and `INDEXNOW_KEY` (names only).
- **DNS safety:** only apex and `www` may change. Keep `baogia`, `cms`, `cdn`, mail, and verification records unchanged.
- **Rollback:** restore the recorded Tenten apex/www records to Vercel, then verify `https://mdftungphat.com`; retain the Vercel project and deployments.

The existing `tungphat` Pages project is not the migration target because it has a stale D1 binding and fails deployment. It remains untouched.

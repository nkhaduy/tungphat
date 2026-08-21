# Tùng Phát production repository

## Canonical local working repository

The permanent local working repository is `/Users/khaduy/tungphat`.
Normal sessions must start with:

```bash
cd ~/tungphat
```

Do not use `~/RECOVERY/repos/tungphat-github` for normal development; it is historical recovery evidence only.

Production targets:

- Main: `mdftungphat.com` on Vercel team `lmskis`, project `tungphat`.
- CMS: `cms.mdftungphat.com`, Cloudflare Worker `tungphat-payload-cms`, Pages project `tungphat-light-cms-production`.
- Never touch KIS LMS resources (`kislms.site`, `kislms-frappe`, `mykis-learning`, or related infrastructure).

- Production website: `https://mdftungphat.com`; CMS: `https://cms.mdftungphat.com`.
- Preserve the existing Vercel frontend and Cloudflare Payload Worker/Pages gateway/D1/R2 architecture.
- Run `npm run verify` before any deployment. After deployment, verify live production; localhost alone is never completion.
- Never delete, replace, import over, or destructively migrate production D1 `tungphat-payload-cms` or R2 `tung-phat-media` without explicit authorization and a verified backup.
- Never expose or commit `.env*`, `.dev.vars*`, `.vercel`, tokens, credentials, or secret values.
- Supplier discovery and media synchronization can perform large network or production writes. Validation commands are safe; do not run upload/sync/delete commands merely as tests.
- Do not force-push `main` or rewrite production history during normal development.

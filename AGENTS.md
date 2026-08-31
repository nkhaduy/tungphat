# Tùng Phát production repository

## Canonical local working repository

The permanent local working repository is `/Users/khaduy/tungphat`.
Normal sessions must start with:

```bash
cd ~/tungphat
git pull
codex
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

## Public-facing Vietnamese content

For any task that writes or rewrites public Vietnamese copy (homepage, product/category/service/local pages, knowledge articles, FAQ, CTA, metadata), use the repository skill:

`$tung-phat-writing` → `.agents/skills/tung-phat-writing/SKILL.md`

The skill is authoritative for Tùng Phát voice: natural trade-expert Vietnamese, buyer-first structure, anti-AI editing, and fact-safe claims. Combine it with SEO tooling/rules when the task also changes search architecture or technical SEO.

Do not use competitor copy as factual evidence for Tùng Phát. Competitors may be studied only for communication patterns; Tùng Phát-specific product, price, stock, standard, service, branch and capability claims must come from Tùng Phát data or authoritative supplier/manufacturer sources.

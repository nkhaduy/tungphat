# Development

The permanent local repository is `/Users/khaduy/tungphat`, and `main` is the canonical development branch. Start normal sessions with:

```bash
cd ~/tungphat
git pull
codex
```

Do not use `/Users/khaduy/RECOVERY/repos/tungphat-github` for normal development; it is historical recovery evidence only. Deployed recovery evidence remains under `/Users/khaduy/RECOVERY/tungphat-deployed-20260821`.

Use Node.js 22 (the repository accepts Node 20.19 through 26) and npm 10 or newer.

```bash
npm ci
npm ci --prefix payload-cms
npm run dev
```

The public site is a Next.js static export. Payload CMS lives in `payload-cms/` and can be run separately with `npm --prefix payload-cms run dev`. Local secrets belong in ignored `.env.local`, `.dev.vars`, or `payload-cms/.env`; templates contain names only.

Run the full non-destructive gate with `npm run verify`. Root typecheck, tests, and build refresh ignored build fixtures from `PAYLOAD_PUBLIC_URL` (default `https://cms.mdftungphat.com`), so they require read-only access to the live CMS. Supplier validation is local and does not authorize crawling, media upload, Payload synchronization, or R2 cleanup.

Key supplier commands are `catalog:suppliers:validate`, `catalog:suppliers:test`, `catalog:suppliers:audit`, `catalog:suppliers:search-index`, and `catalog:suppliers:color-codes`.

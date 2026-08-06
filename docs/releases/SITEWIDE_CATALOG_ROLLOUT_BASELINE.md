# Sitewide Catalogue Rollout Baseline

Date: 2026-08-06

## Repository State

- Repository checkout used for read-only audit: `/Users/khaduy/Downloads/tungphat-release-20260718`
- Rollout worktree: `/Users/khaduy/Downloads/tungphat-main-rollout`
- Rollout branch: `codex/main-sitewide-catalog-rollout`
- Remote main SHA: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`
- Local main SHA: `5565f4035115e47c75b53a70545a649bf2e6fe00` (behind remote by four commits; not modified)
- Production rollback point (`PRE_ROLLOUT_MAIN_SHA`): `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`

## Source Ranges

### Landing and sitewide redesign

- Branch: `codex/landingpage`
- Final source commit: `2e5d6f7f9e0002e08d050e1f26f275073aa3c24f`
- Merge base with `origin/main`: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Commit range: `5565f4035115e47c75b53a70545a649bf2e6fe00..2e5d6f7f9e0002e08d050e1f26f275073aa3c24f`
- Commits: `cc33734`, `2e5d6f7`
- Changed files: 58

### Supplier catalogue

- Branch: `codex/catalog-suppliers-uiux-review`
- Final source commit: `53a3e44f1be94af2225c3a65e1813b1292a3bda2`
- Previous UI/UX base: `66cbcf5f06a05bf26a992c209dcd6fa81d020343`
- Merge base with `origin/main`: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`
- Commit range: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4..53a3e44f1be94af2225c3a65e1813b1292a3bda2`
- Changed files: 1,572

### Cross-source ancestry

- Merge base between landing and catalogue: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Catalogue already contains the current remote main history.
- Landing is based on the previous main and must first absorb the four production commits now present on `origin/main` through the rollout merge.

## Direct File Overlap

The source branches modify 17 common files:

```text
app/bao-gia/page.tsx
app/catalogue/[brand]/page.tsx
app/globals.css
app/page.tsx
app/san-pham/[brand]/page.tsx
app/san-pham/page.tsx
app/sitemap.ts
components/BrandPage.tsx
components/CatalogueView.tsx
components/Footer.tsx
components/Header.tsx
components/Hero.tsx
components/contact/ContactHero.tsx
components/content/ProductLanding.tsx
components/content/ServiceLanding.tsx
playwright.config.ts
tailwind.config.ts
```

## Conflict Risk

- **High:** `app/globals.css`, `tailwind.config.ts`, legacy `Header`/`Footer`/`Hero`, `BrandPage`, and `CatalogueView` because both branches change presentation architecture.
- **High:** `app/sitemap.ts` because catalogue adds a route registry and indexability policy while landing adjusts public route output.
- **Medium:** `app/page.tsx`, product/brand routes, content landing components, and Playwright configuration.
- **Low:** catalogue data, supplier adapters, import pipelines, committed media, and catalogue-only tests because landing does not touch them.
- **Production-specific:** preserve CMS routes, Cloudflare bindings/configuration, production canonical domain, robots policy, and the four commits already on `origin/main`.

## Rollout Strategy

1. Merge `codex/landingpage` alone with a non-fast-forward merge.
2. Resolve conflicts with the landing design system as the UI source of truth while preserving production CMS, SEO, routes, business configuration, and Cloudflare deployment behavior.
3. Run lint, typecheck, Vitest, production build, static audits, Playwright, and responsive browser smoke tests.
4. Push a landing-only commit boundary, review the diff, merge to `main`, deploy through the existing production workflow, and smoke test `https://mdftungphat.com`.
5. Continue only after landing production is stable. Record `PRE_LANDING_DEPLOY_SHA` and `LANDING_RELEASE_SHA`.
6. Synchronize the rollout branch with the new `origin/main`, then merge the catalogue source.
7. Preserve catalogue data, routes, search behavior, SEO/indexability rules, tests, structured data, sitemap registry, and media; port catalogue UI to the landing design system and remove legacy chrome.
8. Deploy catalogue to a Cloudflare Pages preview only, run local/preview quality gates, and audit all required viewport sizes.
9. Do not deploy catalogue media to production while media usage rights remain `UNCONFIRMED`. Landing production remains independently releasable.

## Production Rollback Points

- `PRE_ROLLOUT_MAIN_SHA`: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4`
- `PRE_LANDING_DEPLOY_SHA`: to be recorded immediately before landing merge to `main`
- `LANDING_RELEASE_SHA`: to be recorded after landing merge to `main`
- Catalogue rollback target: `LANDING_RELEASE_SHA`, so a catalogue rollback does not remove the stable landing release.

## Invariants

- No mutation occurs in existing dirty or historical worktrees.
- No force push, destructive reset, clean, checkout restore, DNS change, custom-domain change, or paid service activation.
- No query/filter URLs enter the sitemap.
- Existing `noindex` policies remain intact.
- Catalogue production is blocked until media-right authorization is explicitly resolved.

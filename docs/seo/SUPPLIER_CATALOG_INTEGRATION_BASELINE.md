# Supplier Catalogue Integration Baseline

Date: 2026-08-05

## Protected workspaces

- Original workspace: `/Users/khaduy/Downloads/tungphat-release-20260718`
- An Cuong worktree: `/Users/khaduy/Downloads/tungphat-release-20260718-ancuong`
- Integration worktree: `/Users/khaduy/Downloads/tungphat-supplier-catalog-integration`
- Integration branch: `codex/catalog-suppliers-integration`
- No checkout, reset, clean, stash, restore, push, deployment, or production mutation is permitted outside the integration worktree.

## Source graph

| Supplier | Branch | Requested snapshot | Actual branch tip | Supplier base | Commits | File range |
| --- | --- | --- | --- | --- | ---: | --- |
| Thanh Thuy | `codex/catalog-thanh-thuy-seo` | `280ad65f62cc9013b0f478dd0978679d8b2df311` | `280ad65f62cc9013b0f478dd0978679d8b2df311` | `5565f4035115e47c75b53a70545a649bf2e6fe00` | 5 | 910 files, 24,343 insertions, 26 deletions |
| Ba Thanh | `codex/catalog-ba-thanh-melamine-seo` | `6675ac7f5788229d91e1cbf70cda24f7dff79e8b` | `6675ac7f5788229d91e1cbf70cda24f7dff79e8b` | `5565f4035115e47c75b53a70545a649bf2e6fe00` | 8 | 528 files, 32,467 insertions, 18 deletions |
| An Cuong | `codex/ancuong-catalog-crawler` | `6d158c1c566e9b2f24cd56284c3cf09e27258b11` | `caa911a64da255dc79419b5694be9f11290b90dc` | `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4` | 6 requested | 65 files, 17,486 insertions, 1 deletion |

The An Cuong branch advanced by 11 commits after the requested snapshot. Those commits include full-crawl datasets and crawler hardening (48 files; about 2.43 million insertions). They are intentionally excluded from this integration because the request pins `6d158c1`; the exclusion avoids silently expanding data/storage scope. The requested commit is an ancestor of the actual tip.

## Pairwise merge bases

- Thanh Thuy / Ba Thanh: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Thanh Thuy / An Cuong actual branch: `5565f4035115e47c75b53a70545a649bf2e6fe00`
- Ba Thanh / An Cuong actual branch: `5565f4035115e47c75b53a70545a649bf2e6fe00`

An Cuong was authored from `ed07a2a`, which is a descendant of `5565f40`; pairwise merge-base output therefore correctly resolves to the older common ancestor when compared with Thanh Thuy or Ba Thanh.

## Commit ranges

### Thanh Thuy

`5565f4035115e47c75b53a70545a649bf2e6fe00..280ad65f62cc9013b0f478dd0978679d8b2df311`

1. `2bd76b8` catalogue baseline and design
2. `8962075` duplicate-content audit tests
3. `5ad9a2f` product import pipeline
4. `a0f0697` routes and SEO
5. `280ad65` catalogue quality gates and reports

### Ba Thanh

`5565f4035115e47c75b53a70545a649bf2e6fe00..6675ac7f5788229d91e1cbf70cda24f7dff79e8b`

1. `5e0af9d` discovery pipeline
2. `9e1e3ec` catalogue media
3. `f7ac2d0` code pages and search
4. `6ffa4be` import and route tests
5. `f26356f` crawler/import hardening
6. `9c22099` named-color route validation
7. `c820a19` runbook
8. `6675ac7` verification report refresh

### An Cuong requested snapshot

`ed07a2ad86c8971a5bd3831f96c83fd38c2900f4..6d158c1c566e9b2f24cd56284c3cf09e27258b11`

1. `b5ce145` crawler design and plan
2. `6086ff0` crawler core and CLI contracts
3. `16c8f39` listing and detail crawlers
4. `2a6c9a8` media, validation, diff, and export
5. `7edf28c` representative sample orchestration
6. `6d158c1` audit runbook and sample reports

## Changes outside catalogue scope

- Thanh Thuy modifies four existing content pages, shared header/footer, global CSS, generic product routes, robots, sitemap, redirects, package metadata, and `.gitignore`.
- Ba Thanh modifies four existing content pages, shared header/footer, generic product hub, robots, sitemap, package metadata, and `.gitignore`.
- An Cuong requested range only touches `.gitignore` and `package.json` outside its namespaced data, schema, crawler, reports, and tests.
- Integration resolves shared website files against the newer `ed07a2a` production baseline and carries only supplier-intent changes.

## Safe integration base

Selected base: `ed07a2ad86c8971a5bd3831f96c83fd38c2900f4` (`origin/main` at the audited production snapshot).

Reasons:

- It is a descendant of the Thanh Thuy/Ba Thanh base and the direct base of the requested An Cuong range.
- It contains the audited technical SEO, build, security, metadata, internal-link, sitemap, and title-suffix remediations needed by every catalogue.
- Baseline verification produced 107/107 passing tests, full lint success, and a successful production build with 38 generated pages.
- Baseline typecheck has one known dependency error for `@noble/hashes/argon2.js`; the Thanh Thuy range already introduces the missing package.
- Starting from `5565f40` would discard later production SEO/security fixes. Starting from the moving An Cuong tip would silently import 11 unrequested commits and very large crawl artifacts.

## Integration strategy

Replay supplier commits in authored order onto `ed07a2a`: Thanh Thuy, Ba Thanh, then the six requested An Cuong commits. Resolve each conflict by intent, retain production-baseline SEO/security behavior, and follow with focused shared-core/search/sitemap tests and refactors.

Blind branch merges are not used because the branches have different authored bases, overlap shared navigation/SEO/package files, include changes to existing non-catalogue content, and the An Cuong branch tip no longer matches the pinned snapshot.

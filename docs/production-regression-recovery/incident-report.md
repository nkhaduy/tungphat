# Production regression audit and recovery

Date: 2026-11-26 (Asia/Ho_Chi_Minh)

## Executive finding

PR #37 (`74a9f8958a9fde5edd90674deeb94592452d930f`) was integrated from stale base `5b1b3240521e5251d38a0c23b73b10ccf25d4673`, while the live pre-release static frontend came from the separate `codex/gotungphat-release` line. Its last source commit before the prior Worker upload was `d4e5d1efc454afb18662099ad677a86ae1d98993` (the UI/content tree is also present at `d86670c7b7f898a4e30e1c982ed78945256c06f3`). PR #37 therefore brought Catalogue and Editorial forward from an older integration base without carrying several already-approved homepage, product, navigation, footer, and CNC changes.

The prior Cloudflare Worker version `16750c49-4e3d-4c2f-aa8a-0b50cf1ff3c4` was created 6 seconds after `d4e5d1e`. The current production Worker version `b43086b6-d8d0-4355-8842-fbe476d25890` was created after PR #37 and serves the regressed live HTML. Cloudflare's version API identifies the deployed bundle and configuration, but does not record the Git SHA or preserve a retrievable old static asset bundle. Thus `codex/gotungphat-release` at `d4e5d1e` is the strongest source attribution, not a cryptographically proven exact build workspace.

Old approved screenshots and the old `out/` tree exist in local evidence/worktrees. `out/` was rebuilt after the old Worker upload; it confirms the old source tree and output shape, but is not claimed as the exact Worker v3 artifact. Exact Worker v3 rendered DOM, CSS, and asset bytes could not be extracted from the current Cloudflare version URL. The included before screenshots use that old artifact proxy; the regressed screenshots are from the live production domain before recovery. The user's approved screenshots remain in `docs/product-system/evidence/` in the primary working tree, which this recovery did not modify.

## Evidence inspected

- Merge and base SHAs from the local Git graph; PR #35, #36, #37 metadata and their source branches.
- `codex/gotungphat-release`, `codex/cloudflare-exit`, all visible worktrees, local refs/reflogs, stash list, ignored build artifacts, and relevant uncommitted evidence. The original primary worktree is still dirty and was not edited.
- Cloudflare Worker versions, timestamps, bindings, traffic allocation, and static asset configuration. Production currently serves v4 at 100% traffic; the v3 old version is no longer retrievable as an asset bundle.
- Current live HTML, rendered DOM, metadata, sitemap, representative route responses, and CMS public product API; compared with the old `out/` output and source.
- The current CMS product API responds successfully but contains six product records. Its count alone is not enough to reconstruct the earlier editorial taxonomy.
- `lib/product-editorial.ts` and `lib/content.ts` at the pre-release source show that 12 local material guide pages were merged into CMS results. PR #37 removed that merge path; its static product output and the current sitemap/live route checks confirm the route impact.
- Source/output comparison of homepage card order, hero, header/footer, CNC pages, metadata, product images, review avatars, Catalogue, Editorial, branches, brand pages, quote/contact journeys, and color-code routes.

## Route and component comparison

| Route / component | Before release | After PR #37 | Lost source and recovery |
| --- | --- | --- | --- |
| `/` Hero | H1 `Ván gỗ công nghiệp` + `& gia công CNC`; approved company description and existing catalogue/Zalo quote CTAs | H1 gained `tại Thủ Đức`; description changed | `HomeHero.tsx`, `site-content.ts`; restored on hotfix |
| `/` product section | Exactly 10 approved products in order (see list below), `/sanpham-media/` images | 11 cards from a different taxonomy and image set | `product-taxonomy.ts`, `HomeContent.tsx`, product data/media; restored |
| Shared header/navigation | Product submenu followed the 10 approved categories; labels included “Mã màu”, “Cắt CNC”, “Bài viết” | Menu labels and submenu changed; product menu no longer matched approved set | `SiteHeader.tsx`, `product-taxonomy.ts`; menu restored while retaining current Catalogue supplier navigation and keyboard handling |
| Product index and material details | Editorial product grouping, media, descriptions, canonical host `gotungphat.com` | Product index and detail copy/media changed; some detail routes disappeared | `app/san-pham/page.tsx`, `app/[slug]/page.tsx`, `ProductLanding.tsx`, product editorial/content files and `public/sanpham-media/`; selectively restored |
| 12 material guide URLs | Published, canonical, indexable | Absent from live sitemap and 404 on production | `product-editorial.ts` plus `mergeProductEditorial` in `lib/content.ts`; restored. URLs: `/acrylic/`, `/chi-nep-nhua/`, `/laminate/`, `/melamine/`, `/plywood-phu-melamine/`, `/pvc-film-pet/`, `/tam-veneer/`, `/van-hdf/`, `/van-mfc/`, `/van-nhua-pvc/`, `/van-okal/`, `/van-plywood/` |
| `/gia-cong-cnc/`, `/cat-cnc-go/`, `/gia-cong-cnc-mdf/` | Previous approved service descriptions, headings, metadata and FAQ schema | Service copy/headings/meta changed; FAQ schema disappeared on two detail routes | CNC editorial/content components and `lib/cnc-service-editorial.ts`; restored |
| Homepage brand cards | Logo order Thanh Thùy → An Cường → Ba Thanh | Logo order changed to Thanh Thùy → Ba Thanh → An Cường | `FeaturedColorCodes.tsx`; restored approved brand order while keeping PR #37 Catalogue routes |
| Shared footer / Trustindex | Original company description, branch-specific maps, approved review media | Footer wording and map layout changed; review avatar media IDs changed while 4.8 / 26 reviews remained | `SiteFooter.tsx`, `site-content.ts`, `trustindex-reviews.json`; restored. Footer hostname remains runtime-configured to `gotungphat.com` |
| `/catalogue/`, color-code detail and code indexes | Old catalogue | New Catalogue preserved, including 2,910 codes and filters | Kept PR #37 implementation unchanged |
| `/bai-viet/` and article detail | Previous editorial list/layout | New Editorial layout, categories and TOC | Kept PR #37 implementation unchanged |
| Brand, branch, project routes | Main body, business facts and canonical paths substantially matched | Substantially matched; header/footer differences noted above | No route content rollback. Current domain and CTA behavior retained |
| `/bao-gia/`, `/lien-he/` | Quote/contact details and Zalo journey | Core copy, phone, address and tax details matched; current Zalo CTA remained | Kept current Zalo CTA and contact flow |
| English routes | No complete `/en/` page set in old artifact | No complete `/en/` page set; `/en/` returns 404 | No unsupported English pages invented |

Approved homepage card order restored:

1. Ván MDF – HDF (`/van-mdf/`)
2. MDF chống ẩm (LMR – MMR – HMR) (`/mdf-chong-am/`)
3. Ván Okal – MFC (Ván dăm) (`/van-okal/`)
4. Ván ép – Plywood (`/van-plywood/`)
5. Gỗ ghép cao su (`/go-ghep-cao-su/`)
6. Melamine (`/melamine/`)
7. Laminate (`/laminate/`)
8. Ván phủ Veneer (`/tam-veneer/`)
9. Ván nhựa (`/van-nhua-pvc/`)
10. Chỉ dán cạnh (`/chi-nep-nhua/`)

## Root-cause checks

| Hypothesis | Finding |
| --- | --- |
| Production was built from a branch other than `main` | Confirmed: prior Worker creation time aligns with `codex/gotungphat-release` at `d4e5d1e`; PR #37 merged from the older main base. Worker metadata has no Git SHA, so exact build provenance is high-confidence rather than conclusive. |
| Approved commits were missing from `main` | Confirmed: pre-release homepage/product/CNC source and assets are present on the release branch but absent from the PR #37 base. PR #35/#36 are drafts in the Cloudflare migration / SEO-Zalo lines; neither provides the old Worker bundle. |
| Uncommitted/local source created the old production bundle | Not proven. Relevant old source branch/worktrees and ignored artifacts were inspected. An ignored `content/categories/product-publication.json` exists as `{"hiddenSlugs":[]}` and is required by the restored taxonomy; no release manifest or build log proves which working copy was consumed. The hotfix force-adds this tiny input so future builds are deterministic. |
| PR #37 cherry-picked Catalogue/Editorial and omitted unrelated approved work | Confirmed by route and source diff: Catalogue and Editorial were brought forward while home taxonomy/hero, shared navigation/footer, product editorial merge path, and CNC editorial source were not carried. |
| A stale CMS snapshot overwrote current content | Not supported as the primary cause. Current CMS returns six product documents; the pre-release code intentionally merged local guides around CMS-managed products. Removing that merge path explains the exact 12 removed URLs without any CMS mutation. |
| A prebuild script regenerated content from old source | Not supported as the root cause. Normal synchronization reads public CMS data; the missing 12 guides were controlled by a removed local merge function. The final candidate passed `npm run verify`. |
| Build-time environment changed | Public hostname changed intentionally from `mdftungphat.com` to `gotungphat.com` and is retained. Restored guide canonicals are explicitly based on `PUBLIC_SITE_URL`. Other exact old build env values were not recorded, so full environment equivalence cannot be established. |
| Worker asset or cache served the wrong build | Ruled out for the live regression: current v4 is the 100%-traffic production version; the current page HTML and sitemap match PR #37 source. Home cache is HIT but content is current v4 HTML, not an old cached page. |

The recovery build exposed two secondary integration defects. First, the CMS `go-ghep-tram` record has a published image, alt text and dimensions, but the local taxonomy has no replacement image. The first merge implementation replaced those CMS media fields with empty strings, causing metadata generation to fail with `Social image alt must not be empty`. The final merge now uses reviewed local media when present and retains CMS media fields when the local registry has no replacement. A regression test covers this case; a temporary render check confirmed all current public product metadata now renders.

Second, the editorial material layout returned before the existing Product JSON-LD code for four CMS records whose status is `available`. The build validator identified `/go-ghep-cao-su/`, `/go-ghep-tram/`, `/mdf-chong-am/`, and `/van-mdf/`. The layout now emits the existing factual Product schema helper for non-guide records, and keeps pure editorial guides as CollectionPage. The final structured-data validator passes.

Two visual checks caught issues that the source-only comparison missed. The restored Hero requested mobile WebP filenames that are absent from the built asset set. The approved pre-release screenshot and existing AVIF/PNG assets establish the intended mobile image; a Playwright assertion first failed with `naturalWidth = 0`, then passed with the corrected responsive sources. The featured supplier logo order also differed from the old source/screenshot. A new browser assertion reproduced the Ba Thanh/An Cường swap before `FeaturedColorCodes.tsx` was corrected.

## Recovery implemented

Branch: `hotfix/restore-production-regressions`, isolated worktree at `/Users/khaduy/.codex/worktrees/restore-prod-regressions/tungphat`, based on merge SHA `74a9f8958a9fde5edd90674deeb94592452d930f`. Final candidate source commit: `791f5a72ac0701bf0fc088b8e18c91a200a104e9`. Recovery commits: `d309dba` (approved frontend/content), `27b72ba` (mobile Hero assets), and `791f5a7` (approved supplier-logo order). The original `/Users/khaduy/tungphat` checkout remains untouched with its pre-existing dirty files.

Restored source includes homepage, taxonomy, product details and local editorial guides, product image/index/intros/media data, prior CNC service components/content, footer/company/map data, and review media references. `lib/content.ts` merges local reviewed guides with current CMS product records and still excludes records marked draft/noindex or lacking public evidence. The current catalogue, editorial components and data, Payload compatibility, Zalo CTA, `gotungphat.com` canonicals, Worker configuration, image optimization, frontend security patches, and accessibility behavior are retained.

`content/categories/product-publication.json` was ignored by Git but present in the old worktree with an empty hidden-slug list. It is included explicitly in the recovery branch to prevent environment-dependent taxonomy output.

## Verification and staging review

- Final `npm run verify` passed on the candidate: lint, TypeScript, 750/750 unit tests, supplier validation, 313/313 supplier tests, CMS lint/typecheck, 28/28 CMS integration tests, OpenNext build and production-config Wrangler dry-run, static build, link/sitemap/metadata/schema checks and media/size budgets. It generated 3,661 static pages; validation found zero invalid canonicals, duplicate titles/descriptions, broken links, schema errors or sitemap errors. The CMS Wrangler step was a dry-run; no CMS or production deployment occurred.
- Final staging Playwright run passed 34/34 tests: five recovery tests and 29 Catalogue journeys. Coverage includes the Hero/title/description/meta, approved ten product cards and order, supplier logo order, Zalo quote path, mobile Hero image load, all 12 restored guide routes/canonicals, Catalogue count/filters/infinite scroll/static behavior, Editorial TOC, axe serious/critical findings (0), and horizontal overflow at 320/390/1440 px (0). The final Playwright CLI session recorded zero console errors and warnings.
- Final staging Worker version: `c21ec26c-6077-473e-aa6d-7e878d5b75f0` at https://tungphat-release-staging-20261123.nkhaduy.workers.dev. Homepage returns HTTP 200 with `X-Robots-Tag: noindex, nofollow`; the mobile Hero AVIF also returns HTTP 200. Production remains on Worker version `b43086b6-d8d0-4355-8842-fbe476d25890`.
- Desktop and mobile full-page screenshots (1440 px and 390 px) and comparison evidence are stored in `evidence/`: `before-baseline-desktop.png`, `before-baseline-mobile.png`, `regressed-production-desktop.png`, `regressed-production-mobile.png`, `recovered-candidate-desktop.png`, and `recovered-candidate-mobile.png`.
- Hallmark audit (existing production UI only): 0 critical, 0 major and 0 minor structural/design findings. The material-first hierarchy, product cards, subdued green/wood colors, supplier proof, CNC, branches and Editorial sections remain intact; no redesign was introduced.
- Web Quality: representative homepage, Catalogue and Editorial HTML each returned 0 issues. Each produced 21 false-positive `http://` warnings for the SVG namespace. Metadata/sitemap/schema/link checks and JS budgets passed; axe serious/critical findings are 0. No Lighthouse lab run or field Core Web Vitals data was collected, so this report makes no CWV pass claim.
- Release manifest: `release-manifest.json`; route snapshot: `evidence/release-content-snapshot.json` (3,652 static HTML routes with title, H1, description, canonical and robots). The manifest records source branch/commit, before/after Worker versions, build settings/config hashes, content snapshot hash, artifact SHA-256 `ad2482cce756f526d263d0571b33b851f515afd1ec5d5556922ff862c1fe1b47`, staging Worker version and URL. `scripts/create-static-release-manifest.mjs` is available as `npm run release:manifest` for future verified releases.
- No production deployment or rollback was run. The isolated hotfix branch is ready for owner review on staging; release to production remains gated on owner approval after reviewing this candidate against the approved screenshots and route matrix.

The live production CSP currently blocks the Cloudflare Insights beacon script under `script-src`. This pre-existing production observation is outside the regression recovery and was not broadened into a security audit. The final staging console had no errors or warnings.

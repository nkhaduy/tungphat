# Supplier Catalogue Merge Notes

## Baseline comparison

`codex/catalog-thanh-thuy-seo` points to the same base commit as this branch and is clean at the time of audit. It does not yet contain a committed catalogue pipeline or shared catalogue UI. This Ba Thanh branch therefore has no Thanh Thuy dependency.

## Shared candidates

- `lib/catalog/types.ts`
- `lib/catalog/normalize-code.ts`
- catalogue repository selectors
- `ColorCodeGrid`, `ColorCodeCard`, `ColorCodeSearch`
- `MaterialDisclaimer`, `ProductInquiryCTA`
- metadata/schema and sitemap eligibility helpers
- import report/validation formats

## Supplier-specific boundaries

- Source domain and robots policy
- DOM panel/category detection
- Detail-page recognition rules
- Source category labels and aliases
- Media filename prefix and source disclaimer
- Editorial brand/category copy

## Potential conflicts

- `app/sitemap.ts` and `app/robots.ts`
- `package.json` scripts
- shared catalogue component paths
- global navigation/internal links
- media directories and code slugs
- category slug registries

## Merge recommendation

Merge neither supplier branch blindly. First land the supplier-agnostic types, selectors and UI components as a small shared commit, then rebase each supplier adapter onto that commit. Merge sitemap entries through a single `getSupplierCatalogueSitemapEntries()` aggregator. Namespace media under `public/catalog/{supplier}/` and require supplier plus normalized code for data keys so identical codes across brands never collide.

## Conflict policy

Do not cherry-pick generated data or route commits before the shared core is reconciled. Preserve each supplier's source manifest and editorial copy. Re-run both validators after integration to detect cross-supplier slug, title, sitemap and media-checksum collisions.

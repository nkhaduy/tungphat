# Supplier Catalogue Cannibalization Audit

Date: 2026-08-05

## Scope and policy

The audit covers every supplier route claimed by the shared registry after static export: 355 Thanh Thuy routes, 239 Ba Thanh routes and one An Cuong catalogue route. Search, filter and query variants are excluded from the sitemap and use `noindex,follow` where rendered.

| Intent                     | Primary route family                                     | Distinguishing content                                                              |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| General Melamine education | Existing material/product pages                          | Material properties, substrate choices, applications and general selection guidance |
| Thanh Thuy                 | `/thuong-hieu/thanh-thuy/`, `/san-pham/**/thanh-thuy-*/` | Supplier product catalogue, series, product names and product codes                 |
| Ba Thanh                   | `/thuong-hieu/ba-thanh/`, `/ma-mau-melamine/ba-thanh/**` | Melamine color-code lookup, pattern groups and code-first ordering workflow         |
| An Cuong                   | `/catalogue/an-cuong/`                                   | Pinned crawler sample and factual An Cuong catalogue/product-code data              |

## Output audit

- Supplier pages checked: 595.
- Indexable supplier pages: 20; noindex supplier pages: 575.
- Titles: 595 unique; no duplicate indexable title.
- Meta descriptions: 589 unique; no duplicate indexable description.
- Canonicals checked: 595; canonical conflicts: 0.
- Invalid JSON-LD: 0; supplier brand mismatches: 0.
- Orphan indexable pages: 0.
- Duplicate terminal title suffixes: 0. `/catalogue/an-cuong/` renders exactly `Catalogue An Cường | Tùng Phát` with H1 `Catalogue An Cường`.

## Noindex-only duplication

Two intentionally noindex Thanh Thuy groups reuse generic descriptions while awaiting editorial enrichment:

- Five `chi-nep-nhua` detail pages share the category-level description.
- Three `veneer` detail pages share the category-level description.

All eight pages remain outside the sitemap and carry noindex. They do not compete in the index today. Promotion to `READY_TO_INDEX` must include unique intent-led copy, title/description review and an incoming-link check.

## Structured data and brand isolation

- Thanh Thuy product JSON-LD uses `brand.name = Thanh Thuỳ`.
- Ba Thanh code JSON-LD uses `brand.name = Ba Thanh`.
- An Cuong catalogue output uses An Cuong-specific metadata without invented offers, prices, availability, reviews or ratings.
- Shared builders accept supplier data; no shared catalogue component hardcodes a supplier brand.

## Findings

No active indexable cannibalization was found. The remaining risk is editorial: the eight noindex Thanh Thuy pages must not be promoted until their descriptions and supporting content become unique. The pinned An Cuong route remains noindex, so Lighthouse's crawlability deduction is expected and must not be "fixed" by overriding its quality policy.

## Re-run

```bash
npm run build
npm run catalog:suppliers:audit:output
npm run validate:links
```

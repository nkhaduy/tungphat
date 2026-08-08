# Supplier Catalogue Conflict Matrix

## Range totals

| Supplier | Total | Media | Data | Pipeline | Tests | Docs | App routes | Components | Libraries | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Thanh Thuy | 910 | 856 | 3 | 9 | 7 | 7 | 7 | 8 | 5 | 8 |
| Ba Thanh | 528 | 474 | 6 | 8 | 4 | 8 | 8 | 6 | 8 | 6 |
| An Cuong requested | 65 | 0 | 17 | 19 | 15 | 11 | 0 | 0 | 0 | 3 |

## Exact overlap

### All three suppliers

- `.gitignore`
- `package.json`

### Thanh Thuy and Ba Thanh

- `.gitignore`
- `app/robots.ts`
- `app/san-pham/page.tsx`
- `app/sitemap.ts`
- `components/Footer.tsx`
- `components/Header.tsx`
- `content/pages/gia-cong-cnc-mdf.md`
- `content/products/mdf-chong-am.md`
- `content/products/van-mdf.md`
- `package.json`

### Thanh Thuy and An Cuong

- `.gitignore`
- `package.json`

### Ba Thanh and An Cuong

- `.gitignore`
- `package.json`

## Ownership classification

| Area | Thanh Thuy | Ba Thanh | An Cuong | Resolution rule |
| --- | --- | --- | --- | --- |
| Data | `data/catalogs/thanh-thuy/**`, `data/imports/thanh-thuy/**` | `data/catalogs/ba-thanh.json`, `data/imports/ba-thanh/**` | `data/imports/ancuong/**` | Preserve separate namespaces; no giant combined JSON. |
| Media | 856 WebP files under `public/catalog/thanh-thuy/**` | 474 WebP files under `public/catalog/ba-thanh/**` | Sample manifest/export only in requested snapshot | Preserve local paths; audit checksums and hotlinks. |
| Pipeline | `scripts/thanh-thuy/**` | `scripts/ba-thanh/**` | `scripts/ancuong/**` | Keep supplier adapters independent; share only stable primitives. |
| Schema | Thanh Thuy TypeScript schema | Ba Thanh catalogue types | `schemas/ancuong-catalogue.schema.json` and crawler types | Do not coerce supplier-specific records into one shape. |
| Shared components | None in `components/catalog/shared` yet | Four generic catalogue components | None | Move only truly generic UI to `components/catalog/shared/**`; retain supplier views. |
| Header/Footer | Both add supplier links independently | Both add supplier links independently | Uses base navigation | Build one compact Catalogue/Brands navigation source. |
| Sitemap/robots | Adds Thanh Thuy policies | Adds Ba Thanh policies | Uses base An Cuong catalogue route | Compose registry entries; never overwrite or include noindex/filter URLs. |
| Package scripts | Thanh Thuy scripts and `@noble/hashes` | Ba Thanh scripts | 13 An Cuong CLI scripts | Preserve Next 15.5.21 from base; merge scripts; regenerate lock with npm. |
| Tests | 7 catalogue/e2e tests | 4 catalogue tests (18 files/110 tests branch baseline) | 15 crawler/fixture tests | Keep all, then add cross-supplier route/search/sitemap/schema tests. |
| Outside scope | Existing content, product hubs, CSS, redirects | Existing content and product hub | `.gitignore`, package scripts | Prefer `ed07a2a` website content; port only catalogue-relevant links/copy. |

## Critical file decisions

- `package.json`: preserve base dependency versions and security overrides; add all supplier scripts and the required `@noble/hashes` development dependency.
- `package-lock.json`: never hand edit; regenerate with `npm install --package-lock-only` after package merge.
- `app/sitemap.ts`: replace supplier-specific append logic with a shared supplier sitemap registry while retaining all baseline website entries.
- `app/robots.ts`: retain baseline rules and add query/filter crawl controls only where safe; page metadata remains the authority for noindex.
- `components/Header.tsx` and `components/Footer.tsx`: preserve business configuration, locations, phone/Zalo, responsive behavior, keyboard focus, and compact supplier discovery.
- `lib/seo.ts`: preserve `ed07a2a` title-suffix and metadata fixes; supplier helpers must call the shared metadata builder without duplicating the terminal suffix.
- `app/catalogue/[brand]/page.tsx`: keep stable `/catalogue/an-cuong/`; verify `Catalogue An Cuong | Tung Phat` output and no duplicate suffix.

## Collision audits required after integration

- Route and dynamic shadowing across `/catalogue/**`, `/thuong-hieu/**`, `/ma-mau-melamine/**`, and `/san-pham/**`.
- Exact, case-insensitive, and normalized-code slug collisions.
- Media path, case, checksum, and content-hash collisions.
- Duplicate sitemap URLs, noindex entries, redirects, non-200 routes, and canonical mismatches.
- Duplicate titles/descriptions/H1, supplier brand mismatches, and JSON-LD brand leakage.

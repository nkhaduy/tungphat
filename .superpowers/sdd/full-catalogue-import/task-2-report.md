# Task 2 Report: Ba Thanh Full Import

## Status

DONE_WITH_CONCERNS. The full Ba Thanh import is implemented and validated with 100% source URL accounting. Media rights remain `UNCONFIRMED`; no production deployment or indexability expansion was performed.

## TDD Evidence

### RED

- `npx vitest run tests/ba-thanh-catalog.test.ts tests/ba-thanh-full-import.test.ts`
  - WAY Laminate discovery returned `[]` instead of `W7020`, `P1010`.
  - WAY detail recognition rejected `LAMINATE WAY W7020`.
  - Full record, family, document and manifest builders were absent, causing 8 expected failures.
- `npx vitest run tests/ba-thanh-catalog.test.ts -t "WAY detail route"`
  - Reproduced the supplier map reusing `BT-163.jpg` for `/way-w0502`; parser incorrectly selected `BT163` instead of the route code `W0502`.
- `npx vitest run tests/ba-thanh-catalog.test.ts -t "dash-separated"`
  - Reproduced supplier headings such as `LAMINATE – WAY – W7393`; recognizer rejected them because it required whitespace-only separators.
- `npx vitest run tests/ba-thanh-full-import.test.ts -t "visibly belong"`
  - Reproduced mismatched Melamine media attached to WAY pages; the initial builder retained `BT-163.jpg` and `SC-017-MW.jpg` for `W0502`.

### GREEN

- Focused Ba Thanh suite: `69/69` tests passed across 6 files.
- Full repository lint: passed with zero warnings.
- Full TypeScript checks: passed for the application and Cloudflare configuration.
- Legacy and full Ba Thanh validators: passed.
- Second full import: `created=0`, `updated=0`, `unchanged=279`, `removed=0`, `duplicates=0`.

## Official Source Audit

- Robots: `https://bathanh.com.vn/robots.txt`
- Sitemap index: `https://bathanh.com.vn/sitemap_index.xml`
- Public WordPress pages API: `https://bathanh.com.vn/wp-json/wp/v2/pages`
- Melamine map: `https://bathanh.com.vn/map-ma-melamine`
- Laminate map: `https://bathanh.com.vn/map-mau-laminate`
- Public WordPress pages enumerated: 327 over 4 API pages.
- Unique discovered/accounted URLs after adding referenced media and documents: 712.
- Manifest outcomes: 595 imported, 117 non-product, 0 invalid, 0 blocked, 0 unresolved.

## SKU Records

### Melamine

- Retained: 233/233.
- Vân gỗ: 153.
- Đơn sắc: 62.
- Vân đá: 13.
- Vân vải: 5.
- Legacy second import: `created=0`, `updated=0`, `unchanged=233`, `duplicates=0`.

### WAY Laminate

- Verified public detail URLs: 33/33.
- Vân gỗ: 8.
- Đơn sắc: 16.
- Vân đá: 4.
- Vân vải: 5.
- Codes come from the public `/way-{code}` route and matching visible H1; `WAY` is retained as the collection/brand and is not fabricated into the code.
- Eight verified codes (`P2052`, `P2002`, `P4640`, `F0022`, `F3292`, `F3293`, `F3294`, `F3295`) have no retained image because their public pages currently serve images visibly belonging to unrelated Melamine codes. These SKU records remain useful and noindex rather than carrying false media.

## Family Records

Eleven code-less family records were added. No thickness was converted into an SKU.

| Family | Official source | Verified facts retained |
| --- | --- | --- |
| Ván MDF | `https://bathanh.com.vn/portfolio/gioi-thieu-qui-cach-van-mdf` | 3/5/9/12/15/17/25 mm; source range 2.5-25 mm |
| Ván HDF | `https://bathanh.com.vn/portfolio/van-mdf-hdf` | HDF family; source range 2.5-25 mm |
| MDF chống ẩm HMR | `https://bathanh.com.vn/phan-biet-hdf-va-mdf-loi-xanh.html` | HMR/MMR/LMR aliases; no invented SKU |
| Ván gỗ ghép | `https://bathanh.com.vn/portfolio/van-go-ghep` | Cao su, Thông, Tràm, Xoan mộc; AA/AB/AC; 8-12% moisture; F4 glue |
| Ván OKAL/MFC | `https://bathanh.com.vn/portfolio/vanokal` | 650-750 kg/m3; 1220x2440 and 1830x2440; 17/18/25 mm |
| Ván phủ Melamine | `https://bathanh.com.vn/portfolio/van-phu-melamine` | Melamine faced board family |
| Ván phủ Veneer | `https://bathanh.com.vn/portfolio/van-phu-veneer` | MDF/HDF, gỗ ghép and OKAL core options; 1200x2400 source format |
| Ván phủ giấy | `https://bathanh.com.vn/portfolio/van-phu-giay-melamine` | PU/Amino paper; MDF/OKAL; source surface options |
| Chỉ Veneer/PVC | `https://bathanh.com.vn/portfolio/chi-vien-veneer-pvc` | PVC and Veneer variants with published widths/thicknesses |
| Dongwha Natus | `https://bathanh.com.vn/portfolio/van-mdf-chong-am-hmr-mmr` | Natus collection and published construction claims |
| Dongwha Sanus | `https://bathanh.com.vn/catalogue-van-san-dongwha` | Sanus collection and published surface/moisture claims |

Supplier phone numbers, email addresses and sales contacts are excluded from all normalized records.

## Documents

- `Catalogue Melamine Ba Thanh 2025`: 24 official page images and the public supplier-linked Google Drive document.
- `Catalogue ván sàn Dongwha`: 14 official page images and the public supplier-linked Google Drive document.
- Both document records are `SOURCE_ONLY`, require editorial review and remain noindex.

## Counts and SEO State

- SKU records: 266 (233 Melamine + 33 Laminate).
- Family records: 11.
- Document records: 2.
- Total records: 279.
- `READY_TO_INDEX`: 6 existing editorially complete Melamine records.
- `NEEDS_ENRICHMENT`: 227.
- `NOINDEX_USEFUL`: 44 (33 Laminate + 11 family records).
- `SOURCE_ONLY`: 2 documents.
- No indexability was expanded automatically.

## Media

- Total normalized media references: 326.
- Unique media source URLs: 311.
- Existing local legacy media references retained: 241.
- New source-only media references: 85 (Laminate, family and document assets).
- Rights status: `UNCONFIRMED` for every media reference.
- A transient exact-byte capacity inventory downloaded 82 additional originals totaling 269,330,238 bytes (~257 MiB); the largest was 14,082,828 bytes (~13.43 MiB), below both the 25 MiB Pages asset limit and 100 MiB GitHub file limit.
- Those 82 generated originals are deliberately omitted from the Task 2 commit. The Task 2 brief requires records, documents, manifest accounting and idempotency, while the global Task 3 owns the capacity-safe media strategy. No source-only media is rendered or hotlinked by Task 2.
- Task 3 must choose archival-original storage and color-faithful preview delivery without resize, color correction, saturation, white balance, upscaling or lossy transformation.

## Manifest and Checksums

- Coverage: 712/712 URLs, 100%.
- Normalized manifest checksum: `aa008d3294698263114e5bb26c5dfec534d61e29863b72c481ebd1a2b28254c7`.
- Normalized record checksum: `9ab97c27a24f1ca70c2b5c592053214de2a219f400a416803381d0053d292909`.
- `discovered-laminate-codes.json` SHA-256: `dee1c7c9098c370d69bcb828a22208129bec5b9216beafbeaf580ecf2bd5b689`.
- `full-discovery.json` SHA-256: `f9e0d0ebaa19784b65a68e10ed6547639635224731c0df6ed55a0446eba089f1`.
- `full-records.json` file SHA-256: `c1ca86c4f9072b6e1102b7489b504bd8d56adead925beeaf4e7fda652d333979`.
- `full-source-manifest.json` file SHA-256: `bc8f8a341bfcf35aa23686f1e54eafd282417e0b66cc01d60b8bc4287a714591`.

## Commands Verified

```text
npm run catalog:ba-thanh:discover:full
npm run catalog:ba-thanh:crawl:full
npm run catalog:ba-thanh:import:full -- --dry-run
npm run catalog:ba-thanh:import:full
npm run catalog:ba-thanh:import:full
npm run catalog:ba-thanh:validate:full
npm run lint
npm run typecheck
npx vitest run tests/ba-thanh-catalog.test.ts tests/ba-thanh-full-import.test.ts tests/ba-thanh-http.test.ts tests/ba-thanh-layout.test.ts tests/ba-thanh-media.test.ts tests/ba-thanh-seo.test.ts
```

## Concerns

1. Eight verified WAY Laminate pages currently expose only mismatched supplier media; those records intentionally have no image and remain noindex.
2. The 257 MiB additional-original payload is deferred to Task 3; the 85 new source-only references must not be exposed as hotlinks before that work lands.
3. Media rights remain `UNCONFIRMED`; do not merge or deploy the catalogue to production.

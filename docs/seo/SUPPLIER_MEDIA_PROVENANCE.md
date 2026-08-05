# Supplier Media Provenance

## Deployment status

**Production deployment blocked pending media usage confirmation.**

The integration preserves every supplier snapshot and local media artifact available in the requested commit ranges. It does not claim that Tùng Phát owns, licenses, or is authorized to republish supplier imagery. No production deployment or production media mutation was performed.

## Inventory

| Supplier   | Public source                                                                                                                                             | Local namespace                                                                                     | Media type                                                     |                                                                              Records / files | Checksum source                                                                                                         | Usage-right status | Notes                                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thanh Thuỳ | Product and media URLs recorded per product in `data/catalogs/thanh-thuy/catalog.json`; discovery origin `https://www.gothanhthuy.com`                    | `public/catalog/thanh-thuy/`                                                                        | Responsive WebP product swatches and material images           |                  341 unique source images; 856 local WebP variants; 1,042 variant references | SHA-256 is stored on every variant in `data/catalogs/thanh-thuy/catalog.json`                                           | Unconfirmed        | 0 missing local references, 0 hotlinks, 0 case collisions                                                                                                                                                                                                                 |
| Ba Thanh   | Index/detail/media URLs recorded in `data/imports/ba-thanh/discovered-codes.json` and `data/catalogs/ba-thanh.json`; source root `https://bathanh.com.vn` | `public/catalog/ba-thanh/`                                                                          | WebP swatches, real photos, applications and 480 px thumbnails |                                    241 catalogue images plus 233 thumbnails = 474 WebP files | Source SHA-256 is stored per catalogue image; local output hashes were audited separately                               | Unconfirmed        | 0 missing local references, 0 hotlinks, 0 case collisions; two pairs become byte-identical after WebP processing and are intentionally retained because their stable record paths differ                                                                                  |
| An Cường   | 20 source URLs in `data/imports/ancuong/export/media.json`; allowed hosts are defined in `scripts/ancuong/config.ts`                                      | Runtime-only `data/imports/ancuong/media/files/`; page fallback uses `/partners/an-cuong-logo.webp` | JPEG sample crawler artifacts and local brand fallback         | 20 media records; 13 unique checksums / runtime binaries; 25 MiB current local runtime cache | SHA-256, MIME, dimensions and local path are stored per record in `data/imports/ancuong/normalized/media-manifest.json` | Unconfirmed        | Runtime binaries are intentionally ignored by Git in the pinned An Cường design. The integration downloader recreated all 13 unique files from public sources and verified 0 missing / 0 checksum mismatch. They were not deployed or added to the website public bundle. |

## Duplicate-media findings

The public Thanh Thuỳ and Ba Thanh namespaces contain 1,330 unique paths. A content hash audit found two byte-identical pairs, both within Ba Thanh editorial records:

- `public/catalog/ba-thanh/ba-thanh-melamine-bt-111-other.webp`
- `public/catalog/ba-thanh/ba-thanh-melamine-bt-111-other-2.webp`
- `public/catalog/ba-thanh/ba-thanh-melamine-bt-143-other.webp`
- `public/catalog/ba-thanh/ba-thanh-melamine-bt-143-other-2.webp`

The two extra binaries are not a cross-supplier collision and do not create route or slug duplication. They remain in place to avoid renaming stable media paths without an editorial decision.

An Cường has seven duplicate references that intentionally point to already downloaded checksums. The downloader now reuses a valid local file across source records and roles, and rehydrates a stale manifest only when the referenced binary is absent.

## Validation commands

```bash
npm run catalog:thanh-thuy:validate
npm run catalog:ba-thanh:validate
npm run catalog:ancuong:media -- --concurrency=1
npm run catalog:ancuong:validate
npm run images:check
```

Before any future deployment, obtain written confirmation for each supplier and record the evidence owner, scope, allowed channels, effective date, expiration date and required attribution in this document.

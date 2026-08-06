# Supplier Media Provenance

## Status

Supplier media is inventory/import data only. Rights remain `UNCONFIRMED`; no production deployment, rights escalation, image enhancement, colour correction, white balance, saturation, upscale, or full-original completion claim was performed.

The generated sources of truth are:

- `data/imports/an-cuong/full-media-manifest.json`
- `data/imports/ba-thanh/full-media-manifest.json`
- `data/imports/thanh-thuy/full-media-manifest.json`
- `data/imports/supplier-media-capacity-summary.json`

Each manifest separates supplier source provenance from local delivery. `exact-source-bytes` is reserved for unchanged supplier bytes. Existing Ba Thành and Thanh Thuỳ WebP files are labeled `legacy-transformed`; their local checksum, MIME, dimensions, and byte length describe the delivery file, while the supplier URL and source checksum remain separate provenance.

## Capacity-safe inventory

| Supplier | Total refs | Unique source URLs | Local preview refs | Deduplicated local files | Local bytes | Original provenance only | Unresolved / deferred | Rights |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| An Cường | 9,949 | 7,262 | 0 | 0 | 0 | 6,209 | 3,740 | `UNCONFIRMED` |
| Ba Thành | 352 | 316 | 241 | 239 | 44,162,928 | 0 | 111 | `UNCONFIRMED` |
| Thanh Thuỳ | 353 | 345 | 348 | 286 | 36,194,932 | 0 | 5 | `UNCONFIRMED` |
| Combined | 10,654 | 7,923 | 589 | 525 | 80,357,860 | 6,209 | 3,856 | `UNCONFIRMED` |

An Cường contributes 4,584 archival-original assets with 7,267 product/role references and 2,682 supplier-thumbnail assets with 2,682 preview references. Four URLs overlap between those inventories, producing 7,262 unique An Cường URLs. No An Cường original or thumbnail was added to `public/` in this safety-converged run.

The prebuild source tree currently contains 1,389 files / 144,384,764 bytes. The largest file is 2,267,726 bytes. This is labeled `PREBUILD_SOURCE_PUBLIC` because `out/` is not present; it is a source-public planning measurement, not a claim about the final Pages deployment. Both Cloudflare Pages gates pass: 1,389 is below 20,000 files and 2,267,726 is below 25 MiB. After a build, `postbuild` runs `scripts/check-cloudflare-pages-capacity.mjs` against the complete `out/` tree and fails if either actual deployment gate fails. Limits source: <https://developers.cloudflare.com/pages/platform/limits/> (checked 2026-07-16).

## Crawl safety and metadata

The ignored checkpoint is `.cache/supplier-media/head-inventory.json`. It is atomically updated in batches so interruption does not restart thousands of HEAD requests. It must not be committed.

The final stopped checkpoint contains 3,671 HTTP 200 origins and 529 HTTP 429 origins. Another 3,723 URLs are explicit offline-unknown entries. HTTP 429 records are normalized to `rateLimited: true`, `contentLength: "unknown"`, and optional `retryAfter`; normal resume does not retry them. Terminal errors also remain checkpointed. A later rate-limit refresh requires an explicit command after the supplier's documented delay:

```bash
npm run catalog:suppliers:media -- --refresh-rate-limited --concurrency=1
```

Do not run that command immediately after throttling. Inventory concurrency is globally capped at three, requests are paced per host, redirects are manual and validated at every hop, and one total deadline bounds all redirects/retries. The pipeline uses HEAD only for metadata and never falls back to a broad original GET when `Content-Length` is absent.

Preview GETs are disabled by default, including during metadata refresh. A future authorized sample requires both `--download-previews` and `--preview-limit=N`; `N` is hard-capped at 50.

## Delivery rules

- Only official supplier HTTPS hosts are accepted.
- Remote URLs are source provenance only and are never rendered as local paths.
- Missing local delivery is represented by `UNRESOLVED` or `DEFERRED` with an explicit reason.
- Checksum deduplication retains every product, role, and source relationship.
- No source-only relationship is promoted to local delivery because another record happens to share its URL.
- An Cường supplier thumbnails remain deferred because the live inventory reached rate limits before broad thumbnail validation; no broad preview GET retry was attempted.
- Ba Thành and Thanh Thuỳ source-only originals remain deferred unless a verified small official thumbnail is available in a future import.

## Commands

```bash
npm run catalog:suppliers:media:offline
npm run catalog:suppliers:media:validate
npm test -- --run tests/supplier-full-media.test.ts
```

`next build` does not call the supplier media pipeline and performs no supplier crawl/fetch. The catalogue-only delivery count is not a Pages deployment count; use the `publicDelivery.scope` field and the postbuild `out/` check for deployment capacity.

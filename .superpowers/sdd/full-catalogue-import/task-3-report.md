# Task 3 Report: Capacity-safe Supplier Media Provenance

## Outcome

`DONE_WITH_CONCERNS`

Task 3 implements deterministic, offline/import-only supplier media manifests and capacity gates without downloading the projected An Cường full-original payload. No production deploy or rights-status change occurred.

## TDD evidence

RED was captured before production implementation:

1. `tests/supplier-full-media.test.ts` initially failed because `lib/catalog/full-import/media.ts` did not exist.
2. HEAD-only inventory tests failed while `inventoryMediaOrigin` was absent.
3. Checkpoint/resume tests failed while `inventoryMediaOriginsWithCache` was absent.
4. The total-operation deadline test measured 262 ms against a 100 ms bound before the timeout was changed from per-attempt to whole-operation.
5. Crawl-safety tests failed because HTTP 429 trusted a payload length, normal resume retried cached 429, and requested concurrency reached five.
6. The explicit relationship test failed with 253 generated Ba Thành local refs versus 241 source-declared local refs, identifying URL-only grouping as the root cause.

Final focused result: 16/16 media tests pass.

## Shared provenance model

`lib/catalog/full-import/media.ts` defines:

- official HTTPS host allowlists by supplier;
- source origins with source/final URL, validated redirect chain, status, MIME, `Content-Length` or `unknown`, source checksum, rate-limit evidence, and error;
- product/media references preserving product ID, role, and source URL;
- `LOCAL_PREVIEW`, `ORIGINAL_PROVENANCE_ONLY`, `UNRESOLVED`, `DEFERRED`, and `INVALID` states;
- `exact-source-bytes` versus `legacy-transformed` local delivery metadata;
- local MIME/dimensions/bytes/SHA-256 validation;
- stable checksums independent of generation time/order;
- checksum deduplication that retains all source/product/role relationships;
- hotlink, invented-path, rights, state, metadata, and capacity validation.

All media rights remain `UNCONFIRMED`.

## Crawl and rate-limit safety

The first live attempt was stopped before media writes after discovering that concurrency was bounded per supplier (up to 18 requests), not globally. The implementation was changed to one global checkpointed pool.

The checkpointed pass then exposed supplier HTTP 429 responses. It was stopped rather than treating throttled metadata as complete. An intermediate safety snapshot contained 3,511 HTTP 200 and 689 HTTP 429 outcomes; the atomic cache advanced before termination to a final 3,671 HTTP 200 and 529 HTTP 429 outcomes. No broad live run occurred after the safety stop.

The final implementation:

- globally caps inventory concurrency at three;
- paces request starts per host;
- manually validates every redirect and host;
- uses one total deadline across all hops/retries;
- atomically checkpoints every 20 completed origins in ignored `.cache/supplier-media/`;
- records HTTP 429 as `rateLimited: true`, `contentLength: "unknown"`, optional `retryAfter`, and an explicit error;
- does not retry cached 429 or terminal errors during normal resume;
- requires explicit `--refresh-rate-limited` after a documented wait window;
- disables preview GETs by default and requires explicit `--download-previews --preview-limit=N`, hard-capped at 50;
- uses HEAD only for broad metadata and never GETs a large original because length is missing.

Offline completion filled the remaining 3,723 URLs as explicit offline-unknown inventory. The generated manifests therefore account for all 7,923 combined unique URLs without claiming all public metadata was successfully observed.

## Capacity decision

- Free disk during the task: approximately 25 GiB.
- An Cường normalized products: 2,682.
- An Cường archival-original references: 7,267 across 4,584 unique original/application URLs.
- Prior sampled full-image projection: approximately 29.1 GiB for primary originals alone.
- Result: full-original download remains forbidden/deferred.
- An Cường supplier-thumbnail references: 2,682.
- Result: no broad thumbnail GET was performed after rate limiting; all remain explicit `DEFERRED` preview inventory with no invented local path.
- Ba Thành/Thanh Thuỳ source-only originals remain deferred; existing transformed files are retained and honestly labeled delivery variants.

Cloudflare Pages limits used: 20,000 files and 25 MiB per asset from <https://developers.cloudflare.com/pages/platform/limits/> (updated/checked 2026-07-16).

## Exact generated counts

| Supplier | Total refs | Unique URLs | Local preview refs/files/bytes | Original-only refs | Unresolved/deferred refs | Invalid refs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| An Cường | 9,949 | 7,262 | 0 / 0 / 0 | 6,209 | 3,740 | 0 |
| Ba Thành | 352 | 316 | 241 / 239 / 44,162,928 | 0 | 111 | 0 |
| Thanh Thuỳ | 353 | 345 | 348 / 286 / 36,194,932 | 0 | 5 | 0 |
| Combined | 10,654 | 7,923 | 589 / 525 / 80,357,860 | 6,209 | 3,856 | 0 |

Public catalogue gate evidence:

- files: 1,330 / 20,000 (`PASS`);
- bytes: 107,453,754;
- maximum file: 469,014 / 26,214,400 bytes (`PASS`).

The difference between 1,330 public files and 525 manifest delivery files is expected: the manifest counts checksum-deduplicated delivery assets referenced by the full supplier records, while `public/catalog` also contains legacy thumbnails/variants and duplicate stable paths.

## Determinism and validation

The offline pipeline was run twice after generation. The second run reported:

- all three supplier manifests `changed: false`;
- capacity summary `summaryChanged: false`;
- stable checksums:
  - An Cường: `f71855e36f99be57fb0734a74c2aad03c3378985e36a5e2b0fea215f295f7013`;
  - Ba Thành: `7e48ef6ba83f1f047eff6241325d7343458f92c1b442979f70a0f61f02e99414`;
  - Thanh Thuỳ: `92035ceae4a4d59aa32fb6aa074a013bbca6672b19be29ba9788a3fbaf1069dc`;
  - capacity summary: `22448b5b96c28569c222f665b14d0bf20ebd8520fab398a9ae05e3138b589bd0`.

Final validation results before commit:

- focused media/import tests: 3 files, 22 tests passed;
- full supplier test selection: 37 files, 246 tests passed;
- `catalog:suppliers:media:validate`: all three manifest checksums and local delivery files passed;
- final `catalog:suppliers:media:offline`: all manifests `changed: false`, summary `summaryChanged: false`;
- full ESLint: passed with zero warnings;
- full TypeScript checks (application and Cloudflare config): passed;
- image validator: passed 1,387 images; existing non-blocking legacy/source warnings remain outside Task 3.

## Concerns

- 529 origins remain rate-limited and 3,723 remain offline-unknown; this is explicit inventory, not media completeness.
- An Cường has no new local preview files in this task because broad live retry/download would violate the safety convergence.
- Full supplier originals are not downloaded and must not be described as complete.
- Existing Ba Thành/Thanh Thuỳ local files are transformed legacy delivery variants, not source-original bytes.
- Usage rights remain unconfirmed for every supplier asset.

## Fix round 1

The first review round added regression coverage and closed the seven identified capacity/crawl-safety gaps without making broad supplier requests.

### RED evidence

Before the fix, the new focused tests failed for stale HEAD seed precedence, missing exact-preview functions, missing MIME classification, missing Pages capacity measurement, and missing `publicDelivery.scope`. The preview tests also exercised unsafe initial URLs, one total deadline, single-attempt 429 handling with `Retry-After`, unknown-length body rejection before body access, atomic rate-limit checkpoint resume suppression, and a hard concurrency cap of three.

### GREEN evidence

- `npm test -- --run tests/supplier-full-media.test.ts tests/cloudflare-pages-capacity.test.ts`: 2 files, 25 tests passed.
- `npx tsc --noEmit`: passed.
- Targeted ESLint for all changed TypeScript/JavaScript/test files: passed with zero warnings.
- `node scripts/check-cloudflare-pages-capacity.mjs`: `PREBUILD_SOURCE_PUBLIC`, 1,389 files, 144,384,764 bytes, largest 2,267,726 bytes; both gates `PASS`.
- `npm run build`: passed; postbuild measured the actual `STATIC_OUTPUT` tree at 2,664 files, 198,601,511 bytes, largest 2,108,160 bytes; both Pages gates `PASS`.
- Offline regeneration was run twice; the second run reported all manifests `changed: false` and `summaryChanged: false`.

### Fix-round generated values

The exact combined counts remain 10,654 refs, 7,923 unique URLs, 589 local preview refs, 525 deduplicated files, 80,357,860 local bytes, 6,209 original-only refs, 3,856 unresolved/deferred refs, and `UNCONFIRMED` rights. Updated checksums are:

- An Cường: `951da19323fbbb544372a3556210649d51c743824f5fddc71b75e89f33b058f8`
- Ba Thành: `7e48ef6ba83f1f047eff6241325d7343458f92c1b442979f70a0f61f02e99414`
- Thanh Thuỳ: `92035ceae4a4d59aa32fb6aa074a013bbca6672b19be29ba9788a3fbaf1069dc`
- Capacity summary: `1f936227e3cb0c321c6b56b4325c947a562d35da945d751607365c0ee5019969`

The summary now labels `publicDelivery.scope` as `PREBUILD_SOURCE_PUBLIC` when `out/` is absent. A postbuild hook measures the full static output directory as `STATIC_OUTPUT` and enforces the same 20,000-file and 25 MiB-per-file gates.
